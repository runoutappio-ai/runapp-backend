package com.runout.restaurants.internal.infrastructure.web.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record UpdateRestaurantPortalRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 40) String phone,
        @Size(max = 500) String description,
        @Size(max = 200) String openingHours,
        @Size(max = 500) String formattedAddress,
        @NotBlank @Size(max = 1000) String parkingInstructions,
        @NotBlank @Size(max = 80) String area,
        @Size(max = 500) String websiteUri,
        @NotNull @Min(1) @Max(8) Integer priceTier,
        @NotNull @Size(min = 1, max = 12) List<@NotBlank @Size(max = 80) String> categories
) {
}
