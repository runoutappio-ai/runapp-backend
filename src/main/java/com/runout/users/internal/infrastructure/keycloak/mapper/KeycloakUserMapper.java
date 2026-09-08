package com.runout.users.internal.infrastructure.keycloak.mapper;

import com.runout.users.api.RegisterUserCommand;
import com.runout.users.internal.infrastructure.keycloak.dto.request.KeycloakCredentialRequest;
import com.runout.users.internal.infrastructure.keycloak.dto.request.KeycloakUserRequest;

import java.util.List;

public final class KeycloakUserMapper {

    private KeycloakUserMapper() {
    }

    public static KeycloakUserRequest toRequest(RegisterUserCommand command) {
        var credential = new KeycloakCredentialRequest("password", command.password(), false);
        var name = splitDisplayName(command.displayName());

        return new KeycloakUserRequest(
                command.email(),
                command.email(),
                name.firstName(),
                name.lastName(),
                true,
                false,
                List.of(credential)
        );
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
