package com.runout.authentication.internal.infrastructure.web;

import com.runout.authentication.internal.application.AuthenticationService;
import com.runout.authentication.internal.infrastructure.web.dto.request.LoginRequest;
import com.runout.authentication.internal.infrastructure.web.dto.request.RefreshTokenRequest;
import com.runout.authentication.internal.infrastructure.web.dto.response.TokenResponse;
import com.runout.authentication.internal.infrastructure.web.mapper.AuthenticationMapper;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@SecurityRequirements
class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    TokenResponse login(@Valid @RequestBody LoginRequest request) {
        var tokens = authenticationService.login(request.email(), request.password());
        return AuthenticationMapper.toResponse(tokens);
    }

    @PostMapping("/refresh")
    TokenResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        var tokens = authenticationService.refresh(request.refreshToken());
        return AuthenticationMapper.toResponse(tokens);
    }
}
