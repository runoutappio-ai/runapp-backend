package com.runout.bookings.api;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Currency;
import java.util.List;

public record CreateReservationCommand(
        String identityProviderSubject,
        Instant reservationAt,
        List<String> excludedCuisineTypes,
        int partySize,
        BigDecimal budgetPerPerson,
        Currency currency,
        BigDecimal latitude,
        BigDecimal longitude,
        int radiusMeters,
        String paymentMethodToken,
        String idempotencyKey
) {
    public CreateReservationCommand {
        excludedCuisineTypes = List.copyOf(excludedCuisineTypes);
    }
}
