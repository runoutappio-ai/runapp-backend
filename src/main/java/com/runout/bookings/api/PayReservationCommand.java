package com.runout.bookings.api;

import lombok.Builder;

import java.util.UUID;

@Builder
public record PayReservationCommand(
        UUID userId,
        UUID reservationId,
        String paymentMethodToken,
        UUID idempotencyKey
) {
}
