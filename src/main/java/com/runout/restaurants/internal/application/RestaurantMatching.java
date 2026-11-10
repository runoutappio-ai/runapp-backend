package com.runout.restaurants.internal.application;

import com.runout.restaurants.api.RestaurantMatchCriteria;
import com.runout.restaurants.api.RestaurantSummary;

import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;

final class RestaurantMatching {
    private static final Set<String> VIBES = Set.of(
            "casual", "datenight", "ladiesnight", "guysnight", "extreme", "birthday", "dresstoimpress");

    private RestaurantMatching() {}

    static boolean matches(RestaurantSummary restaurant, RestaurantMatchCriteria criteria) {
        if (!restaurant.active() || !matchesArea(restaurant, criteria)) return false;

        var cuisines = Stream.concat(
                        Stream.of(restaurant.cuisine(), restaurant.primaryType()),
                        Stream.concat(restaurant.categories().stream(), restaurant.types().stream()))
                .map(RestaurantMatching::normalize)
                .collect(Collectors.toSet());
        if (criteria.excludedCuisines().stream().map(RestaurantMatching::normalize).anyMatch(cuisines::contains)) return false;

        var tags = restaurant.tags().stream().map(RestaurantMatching::normalize).collect(Collectors.toSet());
        var vibe = normalize(criteria.vibe());
        if (!vibe.isEmpty() && !tags.contains(vibe)
                && !(vibe.equals("casual") && tags.stream().noneMatch(VIBES::contains))) return false;
        if (!criteria.dietaryPreferences().stream().map(RestaurantMatching::normalize).allMatch(tags::contains)) return false;
        if (criteria.licensedVenue() && !tags.contains("licensedvenue")) return false;
        if (criteria.shishaVenue() && !tags.contains("shisha")) return false;

        return restaurant.menus().stream().anyMatch(menu ->
                Integer.valueOf(criteria.partySize()).equals(menu.partySize())
                        && menu.priceAfterPerPerson() != null
                        && menu.priceAfterPerPerson().signum() >= 0
                        && menu.priceAfterPerPerson().compareTo(criteria.budgetPerPerson()) <= 0);
    }

    private static boolean matchesArea(RestaurantSummary restaurant, RestaurantMatchCriteria criteria) {
        if (criteria.anywhereInDubai()) return "dubai".equals(normalize(restaurant.cityName()));
        if (restaurant.latitude() == null || restaurant.longitude() == null) return false;

        double deltaLat = Math.toRadians(restaurant.latitude() - criteria.latitude());
        double deltaLon = Math.toRadians(restaurant.longitude() - criteria.longitude());
        double haversine = Math.pow(Math.sin(deltaLat / 2), 2)
                + Math.cos(Math.toRadians(criteria.latitude())) * Math.cos(Math.toRadians(restaurant.latitude()))
                * Math.pow(Math.sin(deltaLon / 2), 2);
        double distance = 12_742_000 * Math.asin(Math.sqrt(Math.min(1, haversine)));
        return distance <= criteria.radiusMeters();
    }

    private static String normalize(String value) {
        if (value == null) return "";
        String normalized = value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]", "")
                .replaceFirst("restaurant$", "");
        return normalized.equals("barbecue") ? "bbq" : normalized;
    }
}
