package com.runout.restaurants.api;

import lombok.Builder;

@Builder
public record RestaurantMenuItemSummary(String name, String description) {
}
