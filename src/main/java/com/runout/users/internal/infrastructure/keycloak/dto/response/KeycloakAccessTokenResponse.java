package com.runout.users.internal.infrastructure.keycloak.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

public record KeycloakAccessTokenResponse(@JsonProperty("access_token") String accessToken) {
}
