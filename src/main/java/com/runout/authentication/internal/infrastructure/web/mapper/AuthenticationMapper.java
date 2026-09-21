package com.runout.authentication.internal.infrastructure.web.mapper;

import com.runout.authentication.internal.application.AuthenticationTokens;
import com.runout.authentication.internal.infrastructure.web.dto.response.TokenResponse;

public final class AuthenticationMapper {

    private AuthenticationMapper() {
    }

    public static TokenResponse toResponse(AuthenticationTokens tokens) {
        return TokenResponse.builder()
                .accessToken(tokens.accessToken())
                .expiresIn(tokens.expiresIn())
                .refreshToken(tokens.refreshToken())
                .refreshExpiresIn(tokens.refreshExpiresIn())
                .tokenType(tokens.tokenType())
                .build();
    }
}
