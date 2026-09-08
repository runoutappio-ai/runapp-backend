package com.runout.bookings.internal.application;

import com.runout.bookings.api.BookingConfirmed;
import com.runout.bookings.api.Bookings;
import com.runout.bookings.api.CreateReservationCommand;
import com.runout.bookings.api.RecordManualBookingCommand;
import com.runout.bookings.api.ReservationSummary;
import com.runout.bookings.internal.infrastructure.persistence.BookingRepository;
import com.runout.bookings.internal.infrastructure.persistence.ReservationRepository;
import com.runout.bookings.internal.infrastructure.persistence.entity.BookingEntity;
import com.runout.bookings.internal.infrastructure.persistence.entity.ReservationEntity;
import com.runout.experiences.api.Experiences;
import com.runout.payments.api.CapturePaymentCommand;
import com.runout.payments.api.PaymentGateway;
import com.runout.restaurants.api.Restaurants;
import com.runout.users.api.Users;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Currency;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
class BookingManagement implements Bookings {

    private final BookingRepository repository;
    private final ReservationRepository reservationRepository;
    private final Experiences experiences;
    private final Restaurants restaurants;
    private final Users users;
    private final PaymentGateway paymentGateway;
    private final ApplicationEventPublisher events;

    @Override
    public ReservationSummary create(CreateReservationCommand command) {
        var user = users.requireActiveByIdentityProviderSubject(command.identityProviderSubject());
        var previousReservation = reservationRepository.findByUserIdAndIdempotencyKey(
                user.id(),
                command.idempotencyKey()
        );
        if (previousReservation.isPresent()) {
            var reservation = previousReservation.orElseThrow();
            if (!reservation.represents(command)) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Idempotency-Key was already used for a different reservation"
                );
            }

            return toSummary(reservation);
        }

        var totalBudget = command.budgetPerPerson().multiply(BigDecimal.valueOf(command.partySize()));
        var payment = paymentGateway.capture(new CapturePaymentCommand(
                user.id(),
                totalBudget,
                command.currency(),
                command.paymentMethodToken(),
                command.idempotencyKey()
        ));

        var reservation = new ReservationEntity(
                user.id(),
                command,
                totalBudget,
                payment.reference(),
                payment.status()
        );
        return toSummary(reservationRepository.save(reservation));
    }

    public UUID recordManualBooking(RecordManualBookingCommand command) {
        experiences.requirePublished(command.experienceId());
        restaurants.requireActive(command.restaurantId());
        return repository.save(new BookingEntity(
                command.experienceId(),
                command.restaurantId(),
                command.groupId(),
                command.externalReference(),
                command.reservedAt()
        )).getId();
    }

    public void confirm(UUID id) {
        var booking = repository.findById(id).orElseThrow();
        booking.confirm();
        events.publishEvent(new BookingConfirmed(
                booking.getId(),
                booking.getExperienceId(),
                booking.getRestaurantId(),
                booking.getGroupId(),
                booking.getReservedAt(),
                Instant.now()
        ));
    }

    private ReservationSummary toSummary(ReservationEntity reservation) {
        return new ReservationSummary(
                reservation.getId(),
                reservation.getStatus().name(),
                reservation.getReservationAt(),
                reservation.getExcludedCuisineTypes().stream().toList(),
                reservation.getPartySize(),
                reservation.getBudgetPerPerson(),
                reservation.getTotalBudget(),
                Currency.getInstance(reservation.getCurrency()),
                reservation.getLatitude(),
                reservation.getLongitude(),
                reservation.getRadiusMeters(),
                reservation.getPaymentReference(),
                reservation.getPaymentStatus(),
                reservation.getCreatedAt()
        );
    }
}
