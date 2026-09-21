package com.runout.users.internal.infrastructure.keycloak.dto.request;

import lombok.Builder;

@Builder
public record KeycloakCredentialRequest(String type, String value, boolean temporary) {
}
