package com.runout.bookings.api;

import java.time.Instant;
import java.util.UUID;

public record RecordManualBookingCommand(UUID experienceId, UUID restaurantId, UUID groupId,
                                         String externalReference, Instant reservedAt) {
}
