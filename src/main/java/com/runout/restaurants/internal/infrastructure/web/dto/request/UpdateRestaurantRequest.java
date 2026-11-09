package com.runout.restaurants.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Builder
public record UpdateRestaurantRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 40) String phone,
        @Size(max = 80) String cuisine,
        @Size(max = 12) List<@NotBlank @Size(max = 80) String> categories,
        @Min(1) @Max(8) Integer priceTier,
        @Size(max = 500) String description,
        @Size(max = 200) String openingHours,
        List<@Size(max = 80) String> tags,
        @Size(max = 120) String googlePlaceId,
        @Size(max = 500) String formattedAddress,
        @NotNull UUID cityId,
        @NotBlank @Size(max = 80) String area,
        Double latitude,
        Double longitude,
        Double rating,
        Integer userRatingCount,
        @Size(max = 500) String websiteUri,
        @Size(max = 500) String googleMapsUri,
        @Size(max = 80) String primaryType,
        List<@Size(max = 80) String> types,
        List<MenuRequest> menus
) {
    @Builder
    public record MenuRequest(
            Long id,
            @Min(2) @Max(6) Integer partySize,
            @Min(0) @Max(100) Integer discountPercentage,
            @NotNull @jakarta.validation.constraints.DecimalMin("0.01") java.math.BigDecimal priceBeforePerPerson,
            @NotNull @jakarta.validation.constraints.DecimalMin("0") java.math.BigDecimal priceAfterPerPerson,
            Map<String, List<MenuItemRequest>> sections
    ) {
    }

    public record MenuItemRequest(
            @NotBlank @Size(max = 120) String name,
            @Size(max = 500) String description
    ) {
    }
}
