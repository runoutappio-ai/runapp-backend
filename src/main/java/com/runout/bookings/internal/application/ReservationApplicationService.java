package com.runout.bookings.internal.application;

import com.runout.bookings.api.*;
import com.runout.bookings.internal.domain.ReservationStatus;
import com.runout.bookings.internal.infrastructure.persistence.ReservationRepository;
import com.runout.payments.api.PaymentGateway;
import com.runout.restaurants.api.RestaurantService;
import com.runout.users.api.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
class ReservationApplicationService implements ReservationService {

    private final UserService users;
    private final RestaurantService restaurants;
    private final PaymentGateway paymentGateway;
    private final ApplicationEventPublisher events;
    private final ReservationRepository reservationRepository;

    @Override
    public ReservationSummary create(CreateReservationCommand command) {
        var user = users.findByUserId(command.userId());
        var previousReservation = reservationRepository
                .findByUserIdAndIdempotencyKey(user.id(), command.idempotencyKey());
        if (previousReservation.isPresent()) {
            return ReservationApplicationMapper.toSummary(previousReservation.get());
        }

        var reservation = reservationRepository.save(ReservationApplicationMapper.toReservationEntity(user.id(), command));

        return ReservationApplicationMapper.toSummary(reservation);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationSummary> findAll() {
        return reservationRepository.findAll().stream()
                .map(ReservationApplicationMapper::toSummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationSummary> findAllForUser(UUID userId) {
        users.findByUserId(userId);
        return reservationRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(ReservationApplicationMapper::toSummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReservationSummary> findAllForEmployee(UUID employeeId) {
        users.requireActive(employeeId);
        return reservationRepository.findAllVisibleToEmployee(employeeId, ReservationStatus.PAID).stream()
                .map(ReservationApplicationMapper::toSummary)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationSummary findById(UUID reservationId) {
        return reservationRepository.findById(reservationId)
                .map(ReservationApplicationMapper::toSummary)
                .orElseThrow();
    }

    @Override
    @Transactional(readOnly = true)
    public ReservationSummary findByIdForUser(UUID reservationId, UUID userId) {
        users.findByUserId(userId);
        return reservationRepository.findByIdAndUserId(reservationId, userId)
                .map(ReservationApplicationMapper::toSummary)
                .orElseThrow();
    }

    @Override
    @Transactional(noRollbackFor = ResponseStatusException.class)
    public ReservationSummary pay(PayReservationCommand command) {
        users.findByUserId(command.userId());
        var reservation = reservationRepository.findByIdAndUserId(command.reservationId(), command.userId()).orElseThrow();

        try {
            var payment = paymentGateway.capture(ReservationApplicationMapper.toCapturePaymentCommand(reservation, command));
            reservation.markPaid(payment.reference(), payment.status());
        } catch (ResponseStatusException error) {
            reservation.markPaymentFailed(error.getStatusCode().toString());
            throw error;
        }

        return ReservationApplicationMapper.toSummary(reservation);
    }

    @Override
    public void cancel(UUID reservationId, UUID userId) {
        users.findByUserId(userId);
        var reservation = reservationRepository.findByIdAndUserId(reservationId, userId).orElseThrow();
        reservation.cancel();
    }

    @Override
    public ReservationSummary confirm(ConfirmReservationCommand command) {
        restaurants.requireActive(command.restaurantId());
        var reservation = reservationRepository.findById(command.reservationId()).orElseThrow();
        reservation.confirm(command.restaurantId(), command.externalReference(), command.reservedAt());
        events.publishEvent(ReservationApplicationMapper.toReservationConfirmed(reservation));
        return ReservationApplicationMapper.toSummary(reservation);
    }

    @Override
    public void assignReservation(UUID reservationId, UUID employeeId) {
        var reservation = reservationRepository.findById(reservationId).orElseThrow();
        reservation.assign(employeeId);
    }

    @Override
    public void startReservation(UUID reservationId) {
        var reservation = reservationRepository.findById(reservationId).orElseThrow();
        reservation.start();
    }

    @Override
    public void rejectReservation(UUID reservationId) {
        var reservation = reservationRepository.findById(reservationId).orElseThrow();
        reservation.reject();
    }

    @Override
    public void sendReservationToUser(UUID reservationId) {
        var reservation = reservationRepository.findById(reservationId).orElseThrow();
        reservation.sendToUser();
    }

    @Override
    public void completeReservation(UUID reservationId) {
        var reservation = reservationRepository.findById(reservationId).orElseThrow();
        reservation.complete();
    }
}
