package com.runout.restaurants.api;

import lombok.Builder;

import java.util.List;

@Builder
public record GooglePlaceCandidate(
        String googlePlaceId,
        String name,
        String formattedAddress,
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
