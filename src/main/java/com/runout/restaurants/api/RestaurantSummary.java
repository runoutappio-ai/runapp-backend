package com.runout.restaurants.api;

import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder(toBuilder = true)
public record RestaurantSummary(
        UUID id,
        String name,
        String phone,
        boolean active,
        String cuisine,
        List<String> categories,
        Integer priceTier,
        String description,
        String openingHours,
        List<String> tags,
        String googlePlaceId,
        String formattedAddress,
        String parkingInstructions,
        UUID cityId,
        String cityName,
        String area,
        Double latitude,
        Double longitude,
        Double rating,
        Integer userRatingCount,
        String websiteUri,
        String googleMapsUri,
        String primaryType,
        List<String> types,
        List<RestaurantMenuSummary> menus,
        UUID ownerUserId,
        String menuStatus,
        List<RestaurantMenuSummary> pendingMenus
) {
    public RestaurantSummary {
        categories = categories == null ? List.of() : List.copyOf(categories);
        tags = tags == null ? List.of() : List.copyOf(tags);
        types = types == null ? List.of() : List.copyOf(types);
        menus = menus == null ? List.of() : List.copyOf(menus);
    }

    public RestaurantSummary publicView() {
        return toBuilder().pendingMenus(List.of()).build();
    }
}
