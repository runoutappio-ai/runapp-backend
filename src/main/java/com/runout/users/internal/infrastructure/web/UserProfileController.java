package com.runout.users.internal.infrastructure.web;

import com.runout.users.api.UserProfile;
import com.runout.users.internal.infrastructure.persistence.UserRepository;
import com.runout.users.internal.infrastructure.web.dto.request.UserProfileRequest;
import com.runout.users.internal.infrastructure.web.dto.response.UserProfileResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import static com.runout.shared.AuthenticatedUserHeaders.USER_ID;

@RestController
@RequestMapping("/api/v1/users/me")
@RequiredArgsConstructor
@Slf4j
class UserProfileController {

    private final UserRepository users;

    @GetMapping("/profile")
    UserProfileResponse profile(@RequestHeader(USER_ID) UUID userId) {
        log.info("Retrieving profile userId={}", userId);
        var user = users.findById(userId).orElseThrow();
        return UserProfileResponse.builder()
                .profile(user.getProfile())
                .build();
    }

    @PatchMapping("/profile")
    @Transactional
    UserProfileResponse updateProfile(@RequestHeader(USER_ID) UUID userId,
                                      @Valid @RequestBody UserProfileRequest request) {
        log.info("Updating profile userId={}", userId);
        var user = users.findById(userId).orElseThrow();
        user.updateProfile(UserProfile.builder()
                .phone(request.phone())
                .birthDate(request.birthDate())
                .dietaryPreferences(request.dietaryPreferences())
                .allergyNotes(request.allergyNotes())
                .marketingNotificationsEnabled(request.marketingNotificationsEnabled())
                .reservationNotificationsEnabled(request.reservationNotificationsEnabled())
                .address(toAddress(request.address()))
                .build());
        return profile(userId);
    }

    private UserProfile.Address toAddress(UserProfileRequest.AddressRequest request) {
        if (request == null) {
            return null;
        }
        return UserProfile.Address.builder()
                .label(request.label())
                .formattedAddress(request.formattedAddress())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .build();
    }
}
