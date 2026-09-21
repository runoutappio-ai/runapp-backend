package com.runout.bookings.internal.infrastructure.web.dto.response;

import com.runout.restaurants.api.RestaurantMenuSummary;
import com.runout.restaurants.api.RestaurantSummary;
import lombok.Builder;

import java.util.List;

@Builder
public record ReservationRevealResponse(
        boolean available,
        String status,
        ReservationResponse reservation,
        RestaurantSummary restaurant,
        List<RestaurantMenuSummary> menu
) {
}
