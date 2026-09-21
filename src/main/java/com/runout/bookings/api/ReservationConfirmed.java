package com.runout.bookings.api;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record ReservationConfirmed(
        UUID reservationId,
        UUID restaurantId,
        String externalReference,
        Instant reservedAt,
        Instant occurredAt
) {
}
