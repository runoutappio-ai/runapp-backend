package com.runout.bookings.internal.infrastructure.web.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;
import java.util.List;

public record CreateReservationRequest(
        @NotNull @Future OffsetDateTime reservationAt,
        @NotNull @Size(max = 3) List<@NotBlank @Pattern(regexp = "[A-Z][A-Z0-9_]{1,39}") String> excludedCuisineTypes,
        @Min(1) @Max(20) int partySize,
        @NotNull @Valid MoneyRequest budgetPerPerson,
        @NotNull @Valid SearchAreaRequest searchArea,
        @NotBlank @Size(max = 255) String paymentMethodToken
) {
    public CreateReservationRequest {
        excludedCuisineTypes = excludedCuisineTypes == null ? null : List.copyOf(excludedCuisineTypes);
    }
}
