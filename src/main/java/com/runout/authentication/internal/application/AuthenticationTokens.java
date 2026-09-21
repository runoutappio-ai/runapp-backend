package com.runout.authentication.internal.application;

import lombok.Builder;

@Builder
public record AuthenticationTokens(String accessToken,
                                   long expiresIn,
                                   String refreshToken,
                                   long refreshExpiresIn,
                                   String tokenType
) {
}
