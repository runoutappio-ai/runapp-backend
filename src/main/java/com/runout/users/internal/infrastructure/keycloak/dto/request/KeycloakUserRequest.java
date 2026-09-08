package com.runout.users.internal.infrastructure.keycloak.dto.request;

import java.util.List;

public record KeycloakUserRequest(
        String username,
        String email,
        String firstName,
        String lastName,
        boolean enabled,
        boolean emailVerified,
        List<KeycloakCredentialRequest> credentials
) {
    public KeycloakUserRequest {
        credentials = List.copyOf(credentials);
    }
}
