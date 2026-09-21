package com.runout.restaurants.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;
import java.util.Map;

@Builder
public record CreateRestaurantRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 40) String phone,
        @Size(max = 80) String cuisine,
        @Min(1) @Max(4) Integer priceTier,
        @Size(max = 500) String description,
        @Size(max = 200) String openingHours,
        List<@Size(max = 80) String> tags,
        @Size(max = 120) String googlePlaceId,
        @Size(max = 500) String formattedAddress,
        Double latitude,
        Double longitude,
        Double rating,
        Integer userRatingCount,
        @Size(max = 500) String websiteUri,
        @Size(max = 500) String googleMapsUri,
        @Size(max = 80) String primaryType,
        List<@Size(max = 80) String> types,
        List<MenuRequest> menus
) {
    @Builder
    public record MenuRequest(
            Long id,
            Map<@Size(max = 120) String, @Size(max = 500) String> entries
    ) {
    }
}
