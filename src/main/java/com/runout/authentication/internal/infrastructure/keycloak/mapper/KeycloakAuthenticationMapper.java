package com.runout.authentication.internal.infrastructure.keycloak.mapper;

import com.runout.authentication.internal.application.AuthenticationTokens;
import com.runout.authentication.internal.infrastructure.keycloak.dto.response.KeycloakTokenResponse;

public final class KeycloakAuthenticationMapper {

    private KeycloakAuthenticationMapper() {
    }

    public static AuthenticationTokens toAuthenticationTokens(KeycloakTokenResponse response) {
        return new AuthenticationTokens(
                response.accessToken(),
                response.expiresIn(),
                response.refreshToken(),
                response.refreshExpiresIn(),
                response.tokenType()
        );
    }
}
