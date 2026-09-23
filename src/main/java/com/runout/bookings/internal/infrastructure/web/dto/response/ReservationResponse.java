package com.runout.bookings.internal.infrastructure.web.dto.response;

import lombok.Builder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Builder
public record ReservationResponse(
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
        MoneyResponse budgetPerPerson,
        MoneyResponse totalBudget,
        SearchAreaResponse searchArea,
        PaymentResponse payment,
        UUID assignedEmployeeId,
        UUID restaurantId,
        String externalReference,
        Instant confirmedReservationAt,
        ReservationFeedbackResponse feedback,
        Instant createdAt
) {
    public ReservationResponse {
        excludedCuisineTypes = List.copyOf(excludedCuisineTypes);
        dietaryPreferences = dietaryPreferences == null ? List.of() : List.copyOf(dietaryPreferences);
    }
}
