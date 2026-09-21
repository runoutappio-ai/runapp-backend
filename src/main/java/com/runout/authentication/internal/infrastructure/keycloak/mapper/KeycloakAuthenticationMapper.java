package com.runout.authentication.internal.infrastructure.keycloak.mapper;

import com.runout.authentication.internal.application.AuthenticationTokens;
import com.runout.authentication.internal.infrastructure.keycloak.dto.response.KeycloakTokenResponse;

public final class KeycloakAuthenticationMapper {

    private KeycloakAuthenticationMapper() {
    }

    public static AuthenticationTokens toAuthenticationTokens(KeycloakTokenResponse response) {
        return AuthenticationTokens.builder()
                .accessToken(response.accessToken())
                .expiresIn(response.expiresIn())
                .refreshToken(response.refreshToken())
                .refreshExpiresIn(response.refreshExpiresIn())
                .tokenType(response.tokenType())
                .build();
    }
}
