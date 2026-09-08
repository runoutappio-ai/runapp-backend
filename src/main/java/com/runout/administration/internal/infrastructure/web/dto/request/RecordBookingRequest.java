package com.runout.administration.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.UUID;

public record RecordBookingRequest(
        @NotNull UUID experienceId,
        @NotNull UUID restaurantId,
        @NotNull UUID groupId,
        @NotBlank String externalReference,
        @Future Instant reservedAt
) {
}
