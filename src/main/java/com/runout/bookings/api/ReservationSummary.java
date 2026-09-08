package com.runout.bookings.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Currency;
import java.util.List;
import java.util.UUID;

public record ReservationSummary(
        UUID id,
        String status,
        Instant reservationAt,
        List<String> excludedCuisineTypes,
        int partySize,
        BigDecimal budgetPerPerson,
        BigDecimal totalBudget,
        Currency currency,
        BigDecimal latitude,
        BigDecimal longitude,
        int radiusMeters,
        String paymentReference,
        String paymentStatus,
        Instant createdAt
) {
    public ReservationSummary {
        excludedCuisineTypes = List.copyOf(excludedCuisineTypes);
    }
}
