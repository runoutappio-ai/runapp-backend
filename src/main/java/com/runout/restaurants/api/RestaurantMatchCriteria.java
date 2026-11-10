package com.runout.restaurants.api;

import java.math.BigDecimal;
import java.util.List;

public record RestaurantMatchCriteria(
        double latitude,
        double longitude,
        int radiusMeters,
        boolean anywhereInDubai,
        int partySize,
        BigDecimal budgetPerPerson,
        String vibe,
        List<String> excludedCuisines,
        List<String> dietaryPreferences,
        boolean licensedVenue,
        boolean shishaVenue
) {}
