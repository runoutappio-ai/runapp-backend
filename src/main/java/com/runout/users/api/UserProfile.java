package com.runout.users.api;

import lombok.Builder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Builder
public record UserProfile(
        String phone,
        LocalDate birthDate,
        List<String> dietaryPreferences,
        String allergyNotes,
        Boolean marketingNotificationsEnabled,
        Boolean reservationNotificationsEnabled,
        Address address
) {
    public UserProfile {
        dietaryPreferences = dietaryPreferences == null ? List.of() : List.copyOf(dietaryPreferences);
    }

    @Builder
    public record Address(
            String label,
            String formattedAddress,
            BigDecimal latitude,
            BigDecimal longitude
    ) {
    }
}
