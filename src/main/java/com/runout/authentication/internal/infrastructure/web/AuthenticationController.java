package com.runout.authentication.internal.infrastructure.web;

import com.runout.authentication.internal.application.AuthenticationService;
import com.runout.authentication.internal.infrastructure.web.dto.request.LoginRequest;
import com.runout.authentication.internal.infrastructure.web.dto.request.RefreshTokenRequest;
import com.runout.authentication.internal.infrastructure.web.dto.response.TokenResponse;
import com.runout.authentication.internal.infrastructure.web.mapper.AuthenticationMapper;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@SecurityRequirements
@RequiredArgsConstructor
@Slf4j
@RequestMapping("/api/v1/auth")
class AuthenticationController {

    private final AuthenticationService authenticationService;

    @PostMapping("/login")
    TokenResponse login(@Valid @RequestBody LoginRequest request) {
        log.info("Login requested");
        var tokens = authenticationService.login(request.email(), request.password());
        return AuthenticationMapper.toResponse(tokens);
    }

    @PostMapping("/refresh")
    TokenResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("Access token refresh requested");
        var tokens = authenticationService.refresh(request.refreshToken());
        return AuthenticationMapper.toResponse(tokens);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout() {
        log.info("Logout requested");
    }
}
