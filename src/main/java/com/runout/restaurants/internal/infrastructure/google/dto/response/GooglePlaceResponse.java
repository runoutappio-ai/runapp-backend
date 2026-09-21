package com.runout.restaurants.internal.infrastructure.google.dto.response;

import java.util.List;

public record GooglePlaceResponse(
        String id,
        LocalizedText displayName,
        String formattedAddress,
        String nationalPhoneNumber,
        LatLng location,
        Double rating,
        Integer userRatingCount,
        String websiteUri,
        String googleMapsUri,
        String primaryType,
        List<String> types
) {
}
