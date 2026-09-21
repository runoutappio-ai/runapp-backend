package com.runout.bookings.api;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Currency;
import java.util.List;
import java.util.UUID;

@Builder
public record ReservationSummary(
        UUID id,
        String status,
        Instant reservationAt,
        Instant timeWindowStartAt,
        Instant timeWindowEndAt,
        List<String> excludedCuisineTypes,
        String vibe,
        List<String> dietaryPreferences,
        String allergyNotes,
        String locationLabel,
        int partySize,
        BigDecimal budgetPerPerson,
        BigDecimal totalBudget,
        Currency currency,
        BigDecimal latitude,
        BigDecimal longitude,
        int radiusMeters,
        String paymentReference,
        String paymentStatus,
        UUID assignedEmployeeId,
        UUID restaurantId,
        String externalReference,
        Instant confirmedReservationAt,
        Instant createdAt
) {
    public ReservationSummary {
        excludedCuisineTypes = List.copyOf(excludedCuisineTypes);
        dietaryPreferences = dietaryPreferences == null ? List.of() : List.copyOf(dietaryPreferences);
    }
}
