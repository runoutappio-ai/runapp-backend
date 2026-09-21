package com.runout.administration.internal.infrastructure.web.dto.response;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Builder
public record AdminReservationResponse(
        UUID id,
        String status,
        Instant reservationAt,
        List<String> excludedCuisineTypes,
        int partySize,
        MoneyResponse budgetPerPerson,
        MoneyResponse totalBudget,
        SearchAreaResponse searchArea,
        PaymentResponse payment,
        UUID assignedEmployeeId,
        UUID restaurantId,
        String externalReference,
        Instant confirmedReservationAt,
        Instant createdAt
) {
    public AdminReservationResponse {
        excludedCuisineTypes = List.copyOf(excludedCuisineTypes);
    }

    @Builder
    public record MoneyResponse(BigDecimal amount, String currency) {
    }

    @Builder
    public record SearchAreaResponse(BigDecimal latitude, BigDecimal longitude, int radiusMeters) {
    }

    @Builder
    public record PaymentResponse(String reference, String status) {
    }
}
