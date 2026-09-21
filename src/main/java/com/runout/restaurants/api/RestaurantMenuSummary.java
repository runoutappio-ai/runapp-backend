package com.runout.restaurants.api;

import lombok.Builder;

import java.util.Map;

@Builder
public record RestaurantMenuSummary(Long id, Map<String, String> entries) {
    public RestaurantMenuSummary {
        entries = entries == null ? Map.of() : Map.copyOf(entries);
    }
}
