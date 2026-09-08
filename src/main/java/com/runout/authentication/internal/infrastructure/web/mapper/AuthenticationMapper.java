package com.runout.authentication.internal.infrastructure.web.mapper;

import com.runout.authentication.internal.application.AuthenticationTokens;
import com.runout.authentication.internal.infrastructure.web.dto.response.TokenResponse;

public final class AuthenticationMapper {

    private AuthenticationMapper() {
    }

    public static TokenResponse toResponse(AuthenticationTokens tokens) {
        return new TokenResponse(
                tokens.accessToken(),
                tokens.expiresIn(),
                tokens.refreshToken(),
                tokens.refreshExpiresIn(),
                tokens.tokenType()
        );
    }
}
