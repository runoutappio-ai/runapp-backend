package com.runout.administration.internal.infrastructure.web.dto.response;

import lombok.Builder;

import java.util.UUID;

@Builder
public record NearbyRestaurantResponse(
        UUID id,
        String name,
        String formattedAddress,
        String cuisine,
        Double rating,
        int distanceMeters
) {
}
