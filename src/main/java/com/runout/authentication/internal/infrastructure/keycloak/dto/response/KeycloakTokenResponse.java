package com.runout.authentication.internal.infrastructure.keycloak.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record KeycloakTokenResponse(
        @JsonProperty("access_token") String accessToken,
        @JsonProperty("expires_in") long expiresIn,
        @JsonProperty("refresh_token") String refreshToken,
        @JsonProperty("refresh_expires_in") long refreshExpiresIn,
        @JsonProperty("token_type") String tokenType
) {
}
