package com.runout.restaurants.internal.application;

import com.runout.restaurants.api.RestaurantMatchCriteria;
import com.runout.restaurants.api.RestaurantMenuSummary;
import com.runout.restaurants.api.RestaurantSummary;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class RestaurantMatchingTests {
    private static final RestaurantMenuSummary MENU = RestaurantMenuSummary.builder()
            .partySize(4)
            .priceBeforePerPerson(new BigDecimal("160"))
            .priceAfterPerPerson(new BigDecimal("100"))
            .build();

    private static final RestaurantSummary RESTAURANT = RestaurantSummary.builder()
            .active(true)
            .latitude(25.20)
            .longitude(55.27)
            .cityName("Dubai")
            .types(List.of("italian_restaurant"))
            .tags(List.of("Ladies’ Night", "Gluten-free", "Licensed venue", "Shisha"))
            .menus(List.of(MENU))
            .build();

    @Test
    void usesPublishedMenuPriceAndTableSize() {
        var criteria = criteria(4, 100, false, List.of());
        assertThat(RestaurantMatching.matches(RESTAURANT, criteria)).isTrue();
        assertThat(RestaurantMatching.matches(RESTAURANT, criteria(5, 100, false, List.of()))).isFalse();
        assertThat(RestaurantMatching.matches(RESTAURANT, criteria(4, 99, false, List.of()))).isFalse();
        var pendingOnly = RESTAURANT.toBuilder().menus(List.of()).pendingMenus(List.of(MENU)).build();
        assertThat(RestaurantMatching.matches(pendingOnly, criteria)).isFalse();
    }

    @Test
    void appliesDistanceAndDubaiScope() {
        var distant = RESTAURANT.toBuilder().latitude(25.08).longitude(55.14).build();
        assertThat(RestaurantMatching.matches(distant, criteria(4, 100, false, List.of()))).isFalse();
        assertThat(RestaurantMatching.matches(distant, criteria(4, 100, true, List.of()))).isTrue();
        assertThat(RestaurantMatching.matches(distant.toBuilder().cityName("Sharjah").build(),
                criteria(4, 100, true, List.of()))).isFalse();
    }

    @Test
    void requiresRequestedPreferencesAndNormalizesCuisineExclusions() {
        var criteria = criteria(4, 100, false, List.of());
        assertThat(RestaurantMatching.matches(RESTAURANT, criteria(4, 100, false, List.of("Italian")))).isFalse();
        assertThat(RestaurantMatching.matches(RESTAURANT.toBuilder().active(false).build(), criteria)).isFalse();
        for (String tag : RESTAURANT.tags()) {
            var missingPreference = RESTAURANT.toBuilder()
                    .tags(RESTAURANT.tags().stream().filter(other -> !other.equals(tag)).toList())
                    .build();
            assertThat(RestaurantMatching.matches(missingPreference, criteria)).as("missing %s", tag).isFalse();
        }
    }

    private static RestaurantMatchCriteria criteria(int partySize, int budget, boolean anywhere, List<String> exclusions) {
        return new RestaurantMatchCriteria(25.20, 55.27, 5_000, anywhere, partySize,
                BigDecimal.valueOf(budget), "Ladies' Night", exclusions, List.of("Gluten free"), true, true);
    }
}
