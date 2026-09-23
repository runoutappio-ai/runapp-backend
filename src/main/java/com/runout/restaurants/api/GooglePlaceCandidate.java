package com.runout.restaurants.api;

import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder
public record GooglePlaceCandidate(
        String googlePlaceId,
        String name,
        String formattedAddress,
        UUID cityId,
        String area,
        String phone,
        Double latitude,
        Double longitude,
        Double rating,
        Integer userRatingCount,
        String websiteUri,
        String googleMapsUri,
        String primaryType,
        List<String> types
) {
}
