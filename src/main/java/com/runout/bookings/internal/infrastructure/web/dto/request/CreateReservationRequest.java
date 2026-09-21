package com.runout.bookings.internal.infrastructure.web.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Builder;

import java.time.OffsetDateTime;
import java.util.List;

@Builder
public record CreateReservationRequest(@NotNull @Future OffsetDateTime reservationAt,
                                       @Future OffsetDateTime timeWindowStartAt,
                                       @Future OffsetDateTime timeWindowEndAt,
                                       @NotNull @Size(max = 3) List<String> excludedCuisineTypes,
                                       @Size(max = 40) String vibe,
                                       @Size(max = 12) List<@Size(max = 40) String> dietaryPreferences,
                                       @Size(max = 500) String allergyNotes,
                                       @Size(max = 240) String locationLabel,
                                       @Min(1) @Max(6) int partySize,
                                       @NotNull @Valid MoneyRequest budgetPerPerson,
                                       @Valid MoneyRequest totalBudget,
                                       @NotNull @Valid SearchAreaRequest searchArea
) {
    public CreateReservationRequest {
        excludedCuisineTypes = excludedCuisineTypes == null ? null : List.copyOf(excludedCuisineTypes);
        dietaryPreferences = dietaryPreferences == null ? List.of() : List.copyOf(dietaryPreferences);
    }
}
