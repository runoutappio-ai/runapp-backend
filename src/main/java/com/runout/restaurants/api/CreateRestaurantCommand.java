package com.runout.restaurants.api;

import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder
public record CreateRestaurantCommand(
        String name,
        String phone,
        String cuisine,
        Integer priceTier,
        String description,
        String openingHours,
        List<String> tags,
        String googlePlaceId,
        String formattedAddress,
        UUID cityId,
        String area,
        Double latitude,
        Double longitude,
        Double rating,
        Integer userRatingCount,
        String websiteUri,
        String googleMapsUri,
        String primaryType,
        List<String> types,
        List<RestaurantMenuSummary> menus
) {
    public CreateRestaurantCommand {
        tags = tags == null ? List.of() : List.copyOf(tags);
        types = types == null ? List.of() : List.copyOf(types);
        menus = menus == null ? List.of() : List.copyOf(menus);
    }
}
