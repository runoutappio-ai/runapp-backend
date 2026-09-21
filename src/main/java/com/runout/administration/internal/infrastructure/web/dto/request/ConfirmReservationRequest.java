package com.runout.administration.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record ConfirmReservationRequest(
        @NotNull UUID restaurantId,
        @NotBlank String externalReference,
        @Future Instant reservedAt
) {
}
