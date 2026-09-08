package com.runout.bookings.api;

import java.time.Instant;
import java.util.UUID;

public record BookingConfirmed(UUID bookingId, UUID experienceId, UUID restaurantId, UUID groupId, Instant reservedAt,
                               Instant occurredAt) {
}
