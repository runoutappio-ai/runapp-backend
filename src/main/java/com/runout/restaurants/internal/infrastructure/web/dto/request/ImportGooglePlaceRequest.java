package com.runout.restaurants.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;

@Builder
public record ImportGooglePlaceRequest(
        @NotBlank @Size(max = 120) String googlePlaceId,
        @NotBlank @Size(max = 160) String name,
        @Size(max = 500) String formattedAddress,
        @Size(max = 40) String phone,
        @Size(max = 80) String cuisine,
        @Size(max = 500) String description,
        List<@Size(max = 80) String> tags,
        Double latitude,
        Double longitude,
        Double rating,
        Integer userRatingCount,
        @Size(max = 500) String websiteUri,
        @Size(max = 500) String googleMapsUri,
        @Size(max = 80) String primaryType,
        List<@Size(max = 80) String> types
) {
}
