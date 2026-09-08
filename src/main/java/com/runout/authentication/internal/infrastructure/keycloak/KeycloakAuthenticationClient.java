package com.runout.authentication.internal.infrastructure.keycloak;

import com.runout.authentication.internal.application.AuthenticationTokens;
import com.runout.authentication.internal.application.IdentityProviderAuthentication;
import com.runout.authentication.internal.infrastructure.keycloak.dto.response.KeycloakTokenResponse;
import com.runout.authentication.internal.infrastructure.keycloak.mapper.KeycloakAuthenticationMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Component
class KeycloakAuthenticationClient implements IdentityProviderAuthentication {

    private final RestClient restClient;
    private final String realm;
    private final String clientId;
    private final String clientSecret;

    KeycloakAuthenticationClient(@Value("${runout.identity.keycloak.base-url}") String baseUrl,
                                 @Value("${runout.identity.keycloak.realm}") String realm,
                                 @Value("${runout.identity.keycloak.authentication-client-id}") String clientId,
                                 @Value("${runout.identity.keycloak.authentication-client-secret}") String clientSecret
    ) {
        this.restClient = RestClient.builder().baseUrl(baseUrl).build();
        this.realm = realm;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    @Override
    public AuthenticationTokens login(String email, String password) {
        var form = clientCredentialsForm("password");
        form.add("username", email);
        form.add("password", password);
        form.add("scope", "openid");
        return requestTokens(form, "Invalid email or password");
    }

    @Override
    public AuthenticationTokens refresh(String refreshToken) {
        var form = clientCredentialsForm("refresh_token");
        form.add("refresh_token", refreshToken);
        return requestTokens(form, "Invalid or expired refresh token");
    }

    private LinkedMultiValueMap<String, String> clientCredentialsForm(String grantType) {
        var form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", grantType);
        form.add("client_id", clientId);
        form.add("client_secret", clientSecret);
        return form;
    }

    private AuthenticationTokens requestTokens(LinkedMultiValueMap<String, String> form,
                                               String unauthorizedMessage) {
        try {
            var response = restClient.post()
                    .uri("/realms/{realm}/protocol/openid-connect/token", realm)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(KeycloakTokenResponse.class);

            if (response == null || response.accessToken() == null || response.refreshToken() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Keycloak returned an incomplete token response"
                );
            }

            return KeycloakAuthenticationMapper.toAuthenticationTokens(response);
        } catch (RestClientResponseException error) {
            if (error.getStatusCode().is4xxClientError()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, unauthorizedMessage, error);
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Keycloak authentication is unavailable",
                    error
            );
        }
    }
}
