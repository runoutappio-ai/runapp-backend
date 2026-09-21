package com.runout.locations.internal.infrastructure.web.dto;

import lombok.Builder;

import java.math.BigDecimal;

@Builder
public record LocationCandidateResponse(
        String label,
        String placeId,
        BigDecimal latitude,
        BigDecimal longitude
) {
}
