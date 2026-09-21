package com.runout.bookings.api;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Currency;
import java.util.List;
import java.util.UUID;

@Builder
public record CreateReservationCommand(UUID userId,
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
                                       UUID idempotencyKey
) {
    public CreateReservationCommand {
        excludedCuisineTypes = List.copyOf(excludedCuisineTypes);
        dietaryPreferences = dietaryPreferences == null ? List.of() : List.copyOf(dietaryPreferences);
    }
}
