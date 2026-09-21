package com.runout.authentication.internal.infrastructure.web.dto.response;

import lombok.Builder;

@Builder
public record TokenResponse(
        String accessToken,
        long expiresIn,
        String refreshToken,
        long refreshExpiresIn,
        String tokenType
) {
}
