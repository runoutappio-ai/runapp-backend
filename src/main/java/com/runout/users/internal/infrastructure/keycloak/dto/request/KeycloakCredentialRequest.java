package com.runout.users.internal.infrastructure.keycloak.dto.request;

public record KeycloakCredentialRequest(String type, String value, boolean temporary) {
}
