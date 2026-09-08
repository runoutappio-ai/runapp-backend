package com.runout.authentication.internal.application;

public record AuthenticationTokens(
        String accessToken,
        long expiresIn,
        String refreshToken,
        long refreshExpiresIn,
        String tokenType
) {
}
