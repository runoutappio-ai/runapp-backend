package com.runout.users.internal.infrastructure.keycloak.mapper;

import com.runout.users.api.RegisterUserCommand;
import com.runout.users.internal.infrastructure.keycloak.dto.request.KeycloakCredentialRequest;
import com.runout.users.internal.infrastructure.keycloak.dto.request.KeycloakUserRequest;

import java.util.List;

public final class KeycloakUserMapper {

    private KeycloakUserMapper() {
    }

    public static KeycloakUserRequest toRequest(RegisterUserCommand command) {
        var credential = KeycloakCredentialRequest.builder()
                .type("password")
                .value(command.password())
                .temporary(false)
                .build();
        var name = splitDisplayName(command.displayName());

        return KeycloakUserRequest.builder()
                .username(command.email())
                .email(command.email())
                .firstName(name.firstName())
                .lastName(name.lastName())
                .enabled(true)
                .emailVerified(false)
                .credentials(List.of(credential))
                .build();
    }

    private static KeycloakName splitDisplayName(String displayName) {
        var normalizedName = displayName.trim();
        var lastSeparator = normalizedName.lastIndexOf(' ');
        if (lastSeparator < 0) {
            return new KeycloakName(normalizedName, normalizedName);
        }

        return new KeycloakName(
                normalizedName.substring(0, lastSeparator),
                normalizedName.substring(lastSeparator + 1)
        );
    }

    private record KeycloakName(String firstName, String lastName) {
    }
}
