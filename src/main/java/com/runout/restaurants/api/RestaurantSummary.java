package com.runout.restaurants.api;

import java.util.UUID;

public record RestaurantSummary(UUID id, String name, String phone) {
}
