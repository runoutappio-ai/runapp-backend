package com.runout.authentication.internal.infrastructure.keycloak;

import com.runout.authentication.internal.application.AuthenticationTokens;
import com.runout.authentication.internal.application.IdentityProviderAuthentication;
import com.runout.authentication.internal.infrastructure.keycloak.mapper.KeycloakAuthenticationMapper;
import com.runout.shared.KeycloakProperties;
import com.runout.shared.KeycloakTokenRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Component
@RequiredArgsConstructor
class KeycloakAuthenticationClient implements IdentityProviderAuthentication {

    private final KeycloakAuthenticationHttpClient authenticationHttpClient;
    private final KeycloakProperties keycloakProperties;

    @Override
    public AuthenticationTokens login(String email, String password) {
        var request = KeycloakTokenRequest.password(keycloakProperties,
//                keycloakProperties.authenticationClientId(),
//                keycloakProperties.authenticationClientSecret(),
                email,
                password
        );
        return requestTokens(request, "Invalid email or password");
    }

    @Override
    public AuthenticationTokens refresh(String refreshToken) {
        var request = KeycloakTokenRequest.refreshToken(keycloakProperties, refreshToken);
        return requestTokens(request, "Invalid or expired refresh token");
    }

    private AuthenticationTokens requestTokens(KeycloakTokenRequest request,
                                               String unauthorizedMessage) {
        try {
            var response = authenticationHttpClient.requestTokens(request);

            if (response == null || response.accessToken() == null || response.refreshToken() == null) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_GATEWAY,
                        "Keycloak returned an incomplete token response"
                );
            }

            return KeycloakAuthenticationMapper.toAuthenticationTokens(response);
        } catch (RestClientResponseException error) {
            if (error.getStatusCode().is4xxClientError()) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, unauthorizedReason(error, unauthorizedMessage), error);
            }

            throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Keycloak authentication is unavailable",
                    error
            );
        }
    }

    private String unauthorizedReason(RestClientResponseException error, String fallback) {
        var responseBody = error.getResponseBodyAsString();
        if (responseBody.contains("Account is not fully set up")) {
            return "Keycloak account is not fully set up. Remove required user actions, verify the email and make the password non-temporary.";
        }
        return fallback;
    }
}
