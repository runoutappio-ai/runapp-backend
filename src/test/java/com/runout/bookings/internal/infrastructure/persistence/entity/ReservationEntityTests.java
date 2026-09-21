package com.runout.bookings.internal.infrastructure.persistence.entity;

import com.runout.bookings.api.CreateReservationCommand;
import com.runout.bookings.internal.domain.ReservationStatus;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Currency;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ReservationEntityTests {

    @Test
    void followsReservationStateFlow() {
        var reservation = reservation();

        assertEquals(ReservationStatus.PAYMENT_PENDING, reservation.getStatus());

        reservation.markPaid("mock_reference", "CAPTURED");
        assertEquals(ReservationStatus.PAID, reservation.getStatus());

        var employeeId = UUID.randomUUID();
        reservation.assign(employeeId);
        assertEquals(ReservationStatus.ASSIGNED, reservation.getStatus());
        assertEquals(employeeId, reservation.getAssignedEmployeeId());

        var replacementEmployeeId = UUID.randomUUID();
        reservation.assign(replacementEmployeeId);
        assertEquals(replacementEmployeeId, reservation.getAssignedEmployeeId());

        reservation.start();
        assertEquals(ReservationStatus.IN_PROGRESS, reservation.getStatus());

        reservation.confirm();
        assertEquals(ReservationStatus.CONFIRMED, reservation.getStatus());

        reservation.sendToUser();
        assertEquals(ReservationStatus.SENT_TO_USER, reservation.getStatus());
    }

    @Test
    void rejectsInvalidStateTransition() {
        var reservation = reservation();

        assertThrows(IllegalStateException.class, reservation::sendToUser);
    }

    @Test
    void allowsRejectedReservationToBeStartedAgain() {
        var reservation = reservation();
        reservation.markPaid("mock_reference", "CAPTURED");
        reservation.assign(UUID.randomUUID());
        reservation.start();
        reservation.reject();

        reservation.start();

        assertEquals(ReservationStatus.IN_PROGRESS, reservation.getStatus());
    }

    @Test
    void marksPaymentFailureFromPendingPayment() {
        var reservation = reservation();

        reservation.markPaymentFailed("402 PAYMENT_REQUIRED");

        assertEquals(ReservationStatus.PAYMENT_FAILED, reservation.getStatus());
        assertEquals("402 PAYMENT_REQUIRED", reservation.getPaymentStatus());
    }

    private static ReservationEntity reservation() {
        return ReservationEntity.builder()
                .userId(UUID.randomUUID())
                .command(CreateReservationCommand.builder()
                        .userId(UUID.randomUUID())
                        .reservationAt(Instant.parse("2026-09-11T18:00:00Z"))
                        .excludedCuisineTypes(List.of())
                        .partySize(2)
                        .budgetPerPerson(BigDecimal.valueOf(50))
                        .currency(Currency.getInstance("USD"))
                        .latitude(BigDecimal.valueOf(25.2048))
                        .longitude(BigDecimal.valueOf(55.2708))
                        .radiusMeters(5000)
                        .idempotencyKey(UUID.randomUUID())
                        .build())
                .build();
    }
}
