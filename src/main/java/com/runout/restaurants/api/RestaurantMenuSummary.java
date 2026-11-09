package com.runout.restaurants.api;

import lombok.Builder;

import java.util.List;
import java.util.Map;

@Builder
public record RestaurantMenuSummary(
        Long id,
        Integer partySize,
        Integer discountPercentage,
        java.math.BigDecimal priceBeforePerPerson,
        java.math.BigDecimal priceAfterPerPerson,
        Map<String, List<RestaurantMenuItemSummary>> sections
) {
    public RestaurantMenuSummary {
        if (priceBeforePerPerson != null && priceAfterPerPerson != null && priceBeforePerPerson.signum() > 0) {
            discountPercentage = priceBeforePerPerson.subtract(priceAfterPerPerson)
                    .multiply(java.math.BigDecimal.valueOf(100))
                    .divide(priceBeforePerPerson, 0, java.math.RoundingMode.HALF_UP).intValue();
        }
        sections = sections == null ? Map.of() : Map.copyOf(sections);
    }
}
