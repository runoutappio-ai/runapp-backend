package com.runout.restaurants.api;

import lombok.Builder;

import java.util.List;
import java.util.UUID;

@Builder
public record UpdateRestaurantPortalCommand(
        UUID ownerUserId,
        String name,
        String phone,
        String description,
        String openingHours,
        String formattedAddress,
        String parkingInstructions,
        String area,
        String websiteUri,
        Integer priceTier,
        List<String> categories
) {
    public UpdateRestaurantPortalCommand {
        categories = categories == null ? List.of() : List.copyOf(categories);
    }
}
