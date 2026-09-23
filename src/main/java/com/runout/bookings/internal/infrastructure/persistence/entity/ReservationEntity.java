package com.runout.bookings.internal.infrastructure.persistence.entity;

import com.runout.bookings.api.CreateReservationCommand;
import com.runout.bookings.internal.domain.ReservationStatus;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "reservation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ReservationEntity {

    @Id
    private UUID id;
    private UUID userId;
    private Instant reservationAt;
    private Instant timeWindowStartAt;
    private Instant timeWindowEndAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "reservation_excluded_cuisine", joinColumns = @JoinColumn(name = "reservation_id"))
    @Column(name = "cuisine_type")
    private Set<String> excludedCuisineTypes = new LinkedHashSet<>();

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "reservation_dietary_preference", joinColumns = @JoinColumn(name = "reservation_id"))
    @Column(name = "preference")
    private Set<String> dietaryPreferences = new LinkedHashSet<>();

    private String vibe;
    private String allergyNotes;
    private String locationLabel;
    private int partySize;
    private BigDecimal budgetPerPerson;
    private BigDecimal totalBudget;
    private String currency;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private int radiusMeters;
    private String paymentReference;
    private String paymentStatus;
    private UUID idempotencyKey;
    private UUID assignedEmployeeId;
    private UUID restaurantId;
    private String externalReference;
    private Instant confirmedReservationAt;
    private Integer feedbackRating;

    @Column(length = 1000)
    private String feedbackComment;

    private Boolean feedbackWouldReturnForSurpriseMenu;
    private Instant feedbackSubmittedAt;

    @Enumerated(EnumType.STRING)
    private ReservationStatus status;

    private Instant createdAt;

    @Builder
    public ReservationEntity(
            UUID userId,
            CreateReservationCommand command
    ) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.reservationAt = command.reservationAt();
        this.timeWindowStartAt = command.timeWindowStartAt();
        this.timeWindowEndAt = command.timeWindowEndAt();
        this.excludedCuisineTypes.addAll(command.excludedCuisineTypes());
        this.dietaryPreferences.addAll(command.dietaryPreferences());
        this.vibe = command.vibe();
        this.allergyNotes = command.allergyNotes();
        this.locationLabel = command.locationLabel();
        this.partySize = command.partySize();
        this.budgetPerPerson = command.budgetPerPerson();
        this.totalBudget = command.totalBudget() == null
                ? command.budgetPerPerson().multiply(BigDecimal.valueOf(command.partySize()))
                : command.totalBudget();
        this.currency = command.currency().getCurrencyCode();
        this.latitude = command.latitude();
        this.longitude = command.longitude();
        this.radiusMeters = command.radiusMeters();
        this.idempotencyKey = command.idempotencyKey();
        this.paymentStatus = ReservationStatus.PAYMENT_PENDING.name();
        this.status = ReservationStatus.PAYMENT_PENDING;
        this.createdAt = Instant.now();
    }

    public void markPaid(String paymentReference, String paymentStatus) {
        requireStatus(ReservationStatus.PAYMENT_PENDING, "Only payment-pending reservations can be paid");
        if (!"CAPTURED".equals(paymentStatus)) {
            throw new IllegalStateException("Reservation payment must be captured before it can advance");
        }
        this.paymentReference = paymentReference;
        this.paymentStatus = paymentStatus;
        status = ReservationStatus.PAID;
    }

    public void markPaymentFailed(String paymentStatus) {
        requireStatus(ReservationStatus.PAYMENT_PENDING, "Only payment-pending reservations can fail payment");
        this.paymentStatus = paymentStatus;
        status = ReservationStatus.PAYMENT_FAILED;
    }

    public void cancel() {
        if (status != ReservationStatus.PAYMENT_PENDING && status != ReservationStatus.PAID) {
            throw new IllegalStateException("Only pending-payment or paid reservations can be cancelled");
        }

        status = ReservationStatus.CANCELLED;
    }

    public void assign(UUID employeeId) {
        requireCapturedPayment();
        if (status != ReservationStatus.PAID && status != ReservationStatus.ASSIGNED) {
            throw new IllegalStateException("Only paid or assigned reservations can be assigned");
        }

        this.assignedEmployeeId = employeeId;
        status = ReservationStatus.ASSIGNED;
    }

    public void start() {
        requireCapturedPayment();
        if (status != ReservationStatus.ASSIGNED && status != ReservationStatus.REJECTED) {
            throw new IllegalStateException("Only assigned or rejected reservations can be started");
        }
        status = ReservationStatus.IN_PROGRESS;
    }

    public void confirm() {
        requireStatus(ReservationStatus.IN_PROGRESS, "Only in-progress reservations can be confirmed");
        status = ReservationStatus.CONFIRMED;
    }

    public void confirm(UUID restaurantId, String externalReference, Instant reservedAt) {
        requireStatus(ReservationStatus.IN_PROGRESS, "Only in-progress reservations can be confirmed");
        this.restaurantId = restaurantId;
        this.externalReference = externalReference;
        this.confirmedReservationAt = reservedAt;
        status = ReservationStatus.CONFIRMED;
    }

    public void reject() {
        requireStatus(ReservationStatus.IN_PROGRESS, "Only in-progress reservations can be rejected");
        status = ReservationStatus.REJECTED;
    }

    public void complete() {
        requireStatus(ReservationStatus.CONFIRMED, "Only confirmed reservations can be completed");
        status = ReservationStatus.COMPLETED;
    }

    public void submitFeedback(int rating, String comment, boolean wouldReturnForSurpriseMenu) {
        requireStatus(ReservationStatus.COMPLETED, "Feedback can only be submitted for completed reservations");
        if (feedbackSubmittedAt != null) {
            throw new IllegalStateException("Feedback has already been submitted for this reservation");
        }
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Feedback rating must be between 1 and 5");
        }

        feedbackRating = rating;
        feedbackComment = comment == null || comment.isBlank() ? null : comment.trim();
        feedbackWouldReturnForSurpriseMenu = wouldReturnForSurpriseMenu;
        feedbackSubmittedAt = Instant.now();
    }

    public boolean represents(CreateReservationCommand command) {
        return reservationAt.equals(command.reservationAt())
                && nullableEquals(timeWindowStartAt, command.timeWindowStartAt())
                && nullableEquals(timeWindowEndAt, command.timeWindowEndAt())
                && excludedCuisineTypes.equals(new LinkedHashSet<>(command.excludedCuisineTypes()))
                && dietaryPreferences.equals(new LinkedHashSet<>(command.dietaryPreferences()))
                && nullableEquals(vibe, command.vibe())
                && nullableEquals(allergyNotes, command.allergyNotes())
                && nullableEquals(locationLabel, command.locationLabel())
                && partySize == command.partySize()
                && budgetPerPerson.compareTo(command.budgetPerPerson()) == 0
                && totalBudget.compareTo(command.totalBudget() == null
                ? command.budgetPerPerson().multiply(BigDecimal.valueOf(command.partySize()))
                : command.totalBudget()) == 0
                && currency.equals(command.currency().getCurrencyCode())
                && latitude.compareTo(command.latitude()) == 0
                && longitude.compareTo(command.longitude()) == 0
                && radiusMeters == command.radiusMeters();
    }

    private void requireStatus(ReservationStatus expectedStatus, String message) {
        if (status != expectedStatus) {
            throw new IllegalStateException(message);
        }
    }

    private void requireCapturedPayment() {
        if (!"CAPTURED".equals(paymentStatus)) {
            throw new IllegalStateException("Reservation cannot advance without a captured payment");
        }
    }

    private boolean nullableEquals(Object current, Object next) {
        return current == null ? next == null : current.equals(next);
    }
}
