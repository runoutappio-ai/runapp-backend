package com.runout.users.internal.infrastructure.keycloak.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record KeycloakAccessTokenResponse(@JsonProperty("access_token") String accessToken) {
}
