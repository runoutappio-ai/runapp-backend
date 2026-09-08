package com.runout.users.internal.infrastructure.web;

import com.runout.users.api.Users;
import com.runout.users.internal.infrastructure.web.dto.request.RegisterUserRequest;
import com.runout.users.internal.infrastructure.web.dto.response.RegisteredUserResponse;
import com.runout.users.internal.infrastructure.web.mapper.UserRegistrationMapper;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
class UserRegistrationController {

    private final Users users;

    @PostMapping("/registrations")
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirements
    RegisteredUserResponse register(@Valid @RequestBody RegisterUserRequest request) {
        var user = users.register(UserRegistrationMapper.toCommand(request));
        return UserRegistrationMapper.toResponse(user);
    }
}
