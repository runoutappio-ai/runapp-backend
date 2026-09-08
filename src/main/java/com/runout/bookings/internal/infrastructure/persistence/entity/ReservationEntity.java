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

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "reservation_excluded_cuisine", joinColumns = @JoinColumn(name = "reservation_id"))
    @Column(name = "cuisine_type")
    private Set<String> excludedCuisineTypes = new LinkedHashSet<>();

    private int partySize;
    private BigDecimal budgetPerPerson;
    private BigDecimal totalBudget;
    private String currency;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private int radiusMeters;
    private String paymentReference;
    private String paymentStatus;
    private String idempotencyKey;

    @Enumerated(EnumType.STRING)
    private ReservationStatus status;

    private Instant createdAt;

    public ReservationEntity(
            UUID userId,
            CreateReservationCommand command,
            BigDecimal totalBudget,
            String paymentReference,
            String paymentStatus
    ) {
        this.id = UUID.randomUUID();
        this.userId = userId;
        this.reservationAt = command.reservationAt();
        this.excludedCuisineTypes.addAll(command.excludedCuisineTypes());
        this.partySize = command.partySize();
        this.budgetPerPerson = command.budgetPerPerson();
        this.totalBudget = totalBudget;
        this.currency = command.currency().getCurrencyCode();
        this.latitude = command.latitude();
        this.longitude = command.longitude();
        this.radiusMeters = command.radiusMeters();
        this.paymentReference = paymentReference;
        this.paymentStatus = paymentStatus;
        this.idempotencyKey = command.idempotencyKey();
        this.status = ReservationStatus.PENDING;
        this.createdAt = Instant.now();
    }

    public boolean represents(CreateReservationCommand command) {
        return reservationAt.equals(command.reservationAt())
                && excludedCuisineTypes.equals(new LinkedHashSet<>(command.excludedCuisineTypes()))
                && partySize == command.partySize()
                && budgetPerPerson.compareTo(command.budgetPerPerson()) == 0
                && currency.equals(command.currency().getCurrencyCode())
                && latitude.compareTo(command.latitude()) == 0
                && longitude.compareTo(command.longitude()) == 0
                && radiusMeters == command.radiusMeters();
    }
}
