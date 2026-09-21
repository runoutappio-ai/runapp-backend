package com.runout.bookings.api;

import java.util.List;
import java.util.UUID;

public interface ReservationService {
    ReservationSummary create(CreateReservationCommand command);

    List<ReservationSummary> findAll();

    List<ReservationSummary> findAllForUser(UUID userId);

    List<ReservationSummary> findAllForEmployee(UUID employeeId);

    ReservationSummary findById(UUID reservationId);

    ReservationSummary findByIdForUser(UUID reservationId, UUID userId);

    ReservationSummary pay(PayReservationCommand command);

    void cancel(UUID reservationId, UUID userId);

    ReservationSummary confirm(ConfirmReservationCommand command);

    void assignReservation(UUID reservationId, UUID employeeId);

    void startReservation(UUID reservationId);

    void rejectReservation(UUID reservationId);

    void sendReservationToUser(UUID reservationId);

    void completeReservation(UUID reservationId);
}
