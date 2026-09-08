package com.runout.users.internal.infrastructure.keycloak;

import com.runout.users.api.RegisterUserCommand;
import com.runout.users.internal.application.IdentityProviderRegistration;
import com.runout.users.internal.infrastructure.keycloak.dto.response.KeycloakAccessTokenResponse;
import com.runout.users.internal.infrastructure.keycloak.mapper.KeycloakUserMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Component
class KeycloakAdminClient implements IdentityProviderRegistration {

    private final RestClient restClient;
    private final String realm;
    private final String clientId;
    private final String clientSecret;

    KeycloakAdminClient(
            @Value("${runout.identity.keycloak.base-url}") String baseUrl,
            @Value("${runout.identity.keycloak.realm}") String realm,
            @Value("${runout.identity.keycloak.registration-client-id}") String clientId,
            @Value("${runout.identity.keycloak.registration-client-secret}") String clientSecret
    ) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.realm = realm;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Override
    public String register(RegisterUserCommand command) {
        try {
            var response = restClient.post()
                    .uri("/admin/realms/{realm}/users", realm)
                    .headers(headers -> headers.setBearerAuth(serviceAccessToken()))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(KeycloakUserMapper.toRequest(command))
                    .retrieve()
                    .toBodilessEntity();

            var location = response.getHeaders().getLocation();
            if (location == null) {
                throw unavailable("Keycloak did not return the registered user identifier", null);
            }

            var path = location.getPath();
            return path.substring(path.lastIndexOf('/') + 1);
        } catch (RestClientResponseException error) {
            if (error.getStatusCode().value() == HttpStatus.CONFLICT.value()) {
                throw new IllegalArgumentException("A user with this email already exists");
            }

            throw unavailable("Keycloak rejected the user registration", error);
        }
    }

    @Override
    public void delete(String identityProviderSubject) {
        try {
            restClient.delete()
                    .uri("/admin/realms/{realm}/users/{userId}", realm, identityProviderSubject)
                    .headers(headers -> headers.setBearerAuth(serviceAccessToken()))
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException error) {
            throw unavailable("Could not compensate the Keycloak user registration", error);
        }
    }

    private String serviceAccessToken() {
        var form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "client_credentials");
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);

        try {
            var response = restClient.post()
                    .uri("/realms/{realm}/protocol/openid-connect/token", realm)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(KeycloakAccessTokenResponse.class);

            if (response == null || response.accessToken() == null) {
                throw unavailable("Keycloak did not return a service access token", null);
            }

            return response.accessToken();
        } catch (RestClientResponseException error) {
            throw unavailable("Could not authenticate the registration service with Keycloak", error);
        }
    }

    private ResponseStatusException unavailable(String message, Exception cause) {
        return new ResponseStatusException(HttpStatus.BAD_GATEWAY, message, cause);
    }
}
