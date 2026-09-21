package com.runout.users.internal.infrastructure.web.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;
import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Builder
public record UserProfileRequest(
        @Size(max = 40) String phone,
        LocalDate birthDate,
        List<@Size(max = 40) String> dietaryPreferences,
        @Size(max = 500) String allergyNotes,
        Boolean marketingNotificationsEnabled,
        Boolean reservationNotificationsEnabled,
        @Valid AddressRequest address
) {
    public UserProfileRequest {
        dietaryPreferences = dietaryPreferences == null ? List.of() : List.copyOf(dietaryPreferences);
    }

    @Builder
    public record AddressRequest(
            @Size(max = 80) String label,
            @Size(max = 500) String formattedAddress,
            @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
            @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude
    ) {
    }
}
