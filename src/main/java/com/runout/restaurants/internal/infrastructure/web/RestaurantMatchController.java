package com.runout.restaurants.internal.infrastructure.web;

import com.runout.restaurants.api.RestaurantMatchCriteria;
import com.runout.restaurants.api.RestaurantService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequiredArgsConstructor
class RestaurantMatchController {
    private final RestaurantService restaurants;

    @PostMapping("/api/v1/restaurants/match-count")
    MatchCountResponse count(@Valid @RequestBody MatchCountRequest request) {
        return new MatchCountResponse(restaurants.countMatches(new RestaurantMatchCriteria(
                request.latitude().doubleValue(), request.longitude().doubleValue(), request.radiusMeters(),
                request.anywhereInDubai(), request.partySize(), request.budgetPerPerson(), request.vibe(),
                request.excludedCuisines(), request.dietaryPreferences(), request.licensedVenue(), request.shishaVenue())));
    }

    record MatchCountRequest(
            @NotNull @DecimalMin("-90") @DecimalMax("90") BigDecimal latitude,
            @NotNull @DecimalMin("-180") @DecimalMax("180") BigDecimal longitude,
            @Min(500) @Max(50_000) int radiusMeters,
            boolean anywhereInDubai,
            @Min(2) @Max(6) int partySize,
            @NotNull @DecimalMin("50") @DecimalMax("400") BigDecimal budgetPerPerson,
            @NotBlank @Size(max = 40) String vibe,
            @NotNull @Size(max = 3) List<@NotBlank @Size(max = 40) String> excludedCuisines,
            @NotNull @Size(max = 12) List<@NotBlank @Size(max = 40) String> dietaryPreferences,
            boolean licensedVenue,
            boolean shishaVenue
    ) {}

    record MatchCountResponse(long count) {}
}
