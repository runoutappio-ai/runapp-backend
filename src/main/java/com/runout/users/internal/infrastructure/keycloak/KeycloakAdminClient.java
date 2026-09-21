package com.runout.users.internal.infrastructure.keycloak;

import com.runout.shared.KeycloakProperties;
import com.runout.shared.KeycloakTokenRequest;
import com.runout.users.api.RegisterUserCommand;
import com.runout.users.api.UserRole;
import com.runout.users.internal.application.IdentityProviderRegistration;
import com.runout.users.internal.infrastructure.keycloak.dto.response.KeycloakUserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static com.runout.users.internal.infrastructure.keycloak.mapper.KeycloakUserMapper.toRequest;

@Component
@RequiredArgsConstructor
class KeycloakAdminClient implements IdentityProviderRegistration {

    private static final String BEARER = "Bearer ";

    private final KeycloakProperties keycloakProperties;
    private final KeycloakAdminHttpClient adminHttpClient;
    private final KeycloakTokenHttpClient tokenHttpClient;

    @Override
    public UUID register(RegisterUserCommand command) {
        var accessToken = serviceAccessToken();
        var userId = createUser(command, accessToken);

        try {
            var user = getUser(userId, accessToken);

            if (user == null || user.id() == null) {
                compensateCreatedUser(userId, accessToken);
                throw unavailable("Keycloak did not return the created user representation", null);
            }

            var parsedUserId = parseUserId(user.id());
            try {
                updateRole(parsedUserId, null, UserRole.USER.name());
                return parsedUserId;
            } catch (RuntimeException error) {
                compensateCreatedUser(userId, accessToken);
                throw error;
            }
        } catch (RestClientResponseException error) {
            compensateCreatedUser(userId, accessToken);
            throw unavailable("Could not retrieve the created Keycloak user", error);
        }
    }

    private UUID createUser(RegisterUserCommand command, String accessToken) {
        try {
            var response = adminHttpClient.createUser(authorization(accessToken), toRequest(command));

            var location = response.getHeaders().getLocation();
            if (location == null) {
                throw unavailable("Keycloak did not return the registered user identifier", null);
            }

            var path = location.getPath();
            String id = path.substring(path.lastIndexOf('/') + 1);
            return UUID.fromString(id);
        } catch (RestClientResponseException error) {
            if (error.getStatusCode().value() == HttpStatus.CONFLICT.value()) {
                throw new IllegalArgumentException("A user with this email already exists");
            }

            throw unavailable("Keycloak rejected the user registration", error);
        }
    }

    private KeycloakUserResponse getUser(UUID userId, String accessToken) {
        return adminHttpClient.getUser(userId, authorization(accessToken));
    }

    private void compensateCreatedUser(UUID userId, String accessToken) {
        try {
            adminHttpClient.deleteUser(userId, authorization(accessToken));
        } catch (RestClientResponseException ignored) {
            // The original retrieval failure remains the relevant registration error.
        }
    }

    @Override
    public void delete(UUID userId) {
        try {
            adminHttpClient.deleteUser(userId, authorization(serviceAccessToken()));
        } catch (RestClientResponseException error) {
            throw unavailable("Could not compensate the Keycloak user registration", error);
        }
    }

    @Override
    public void updateRole(UUID userId, String previousRole, String role) {
        var authorization = authorization(serviceAccessToken());
        try {
            if (previousRole != null && !previousRole.equals(role)) {
                var currentRole = adminHttpClient.getRealmRole(previousRole, authorization);
                adminHttpClient.removeRealmRole(userId, authorization, List.of(currentRole));
            }
            var nextRole = adminHttpClient.getRealmRole(role, authorization);
            adminHttpClient.addRealmRole(userId, authorization, List.of(nextRole));
        } catch (RestClientResponseException error) {
            throw unavailable("Could not update the Keycloak user role", error);
        }
    }

    private UUID parseUserId(String userId) {
        try {
            return UUID.fromString(userId);
        } catch (IllegalArgumentException error) {
            throw unavailable("Keycloak returned a non-UUID user identifier", error);
        }
    }

    private String serviceAccessToken() {
        var request = KeycloakTokenRequest.clientCredentials(keycloakProperties);

        try {
            var response = tokenHttpClient.serviceAccessToken(request);

            if (response == null || response.accessToken() == null) {
                throw unavailable("Keycloak did not return a service access token", null);
            }

            return response.accessToken();
        } catch (RestClientResponseException error) {
            throw unavailable("Could not authenticate the registration service with Keycloak", error);
        }
    }

    private String authorization(String accessToken) {
        return BEARER + accessToken;
    }

    private ResponseStatusException unavailable(String message, Exception cause) {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, message, cause);
    }
}
