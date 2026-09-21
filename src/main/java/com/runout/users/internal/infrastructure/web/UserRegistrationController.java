package com.runout.users.internal.infrastructure.web;

import com.runout.users.api.UserService;
import com.runout.users.api.UserSummary;
import com.runout.users.internal.infrastructure.web.dto.request.RegisterUserRequest;
import com.runout.users.internal.infrastructure.web.dto.response.RegisteredUserResponse;
import com.runout.users.internal.infrastructure.web.mapper.UserRegistrationMapper;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

import static com.runout.shared.AuthenticatedUserHeaders.DISPLAY_NAME;
import static com.runout.shared.AuthenticatedUserHeaders.EMAIL;
import static com.runout.shared.AuthenticatedUserHeaders.USER_ID;
import static com.runout.shared.AuthenticatedUserHeaders.USERNAME;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
class UserRegistrationController {

    private final UserService users;

    @GetMapping("/me")
    UserSummary me(@RequestHeader(USER_ID) UUID userId) {
        log.info("Retrieving current user profile userId={}", userId);
        return users.requireActive(userId);
    }

    @PostMapping("/me/provision")
    UserSummary provision(@RequestHeader(USER_ID) UUID userId,
                          @RequestHeader(value = EMAIL, required = false) String email,
                          @RequestHeader(value = DISPLAY_NAME, required = false) String displayName,
                          @RequestHeader(value = USERNAME, required = false) String username) {
        log.info("Provisioning current user profile userId={}", userId);
        return users.provisionAuthenticatedUser(userId, email, displayName, username);
    }

    @PostMapping("/registrations")
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirements
    RegisteredUserResponse register(@Valid @RequestBody RegisterUserRequest request) {
        log.info("Registering user");
        var user = users.register(UserRegistrationMapper.toCommand(request));
        return UserRegistrationMapper.toResponse(user);
    }
}
