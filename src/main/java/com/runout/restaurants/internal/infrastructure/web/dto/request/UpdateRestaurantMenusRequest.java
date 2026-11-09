package com.runout.restaurants.internal.infrastructure.web.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.Map;

public record UpdateRestaurantMenusRequest(
        @NotNull @Min(1) @Max(8) Integer priceTier,
        @NotNull @Size(min = 5, max = 5) List<@Valid MenuRequest> menus
) {
    public record MenuRequest(
            Long id,
            @NotNull @Min(2) @Max(6) Integer partySize,
            @Min(0) @Max(100) Integer discountPercentage,
            @NotNull @jakarta.validation.constraints.DecimalMin("0.01") java.math.BigDecimal priceBeforePerPerson,
            @NotNull @jakarta.validation.constraints.DecimalMin("0") java.math.BigDecimal priceAfterPerPerson,
            @NotNull Map<@NotBlank String, @NotNull List<@Valid MenuItemRequest>> sections
    ) {
    }

    public record MenuItemRequest(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 500) String description
    ) {
    }
}
