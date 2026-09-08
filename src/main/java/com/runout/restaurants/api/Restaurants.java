package com.runout.restaurants.api;

import java.util.UUID;

public interface Restaurants {
    RestaurantSummary requireActive(UUID restaurantId);
}
