package com.runout.administration.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public record CreateExperienceRequest(
        @NotBlank String title,
        @Future Instant startsAt,
        @Min(2) int capacity
) {
}
