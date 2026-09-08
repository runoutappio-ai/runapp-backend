package com.runout.bookings.internal.infrastructure.web.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ReservationResponse(
        UUID id,
        String status,
        Instant reservationAt,
        List<String> excludedCuisineTypes,
        int partySize,
        MoneyResponse budgetPerPerson,
        MoneyResponse totalBudget,
        SearchAreaResponse searchArea,
        PaymentResponse payment,
        Instant createdAt
) {
    public ReservationResponse {
        excludedCuisineTypes = List.copyOf(excludedCuisineTypes);
    }
}
