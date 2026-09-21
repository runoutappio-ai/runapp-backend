package com.runout.authentication.internal.infrastructure.keycloak;

import com.runout.authentication.internal.infrastructure.keycloak.dto.response.KeycloakTokenResponse;
import com.runout.shared.KeycloakTokenRequest;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;

@HttpExchange("/realms/runout/protocol/openid-connect")
public interface KeycloakAuthenticationHttpClient {

    @PostExchange(value = "/token", contentType = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    KeycloakTokenResponse requestTokens(
            @RequestParam("grant_type") String grantType,
            @RequestParam("client_id") String clientId,
            @RequestParam("client_secret") String clientSecret,
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "password", required = false) String password,
            @RequestParam(value = "refresh_token", required = false) String refreshToken,
            @RequestParam(value = "scope", required = false) String scope
    );

    default KeycloakTokenResponse requestTokens(KeycloakTokenRequest request) {
        return requestTokens(
                request.grantType(),
                request.clientId(),
                request.clientSecret(),
                request.username(),
                request.password(),
                request.refreshToken(),
                request.scope()
        );
    }
}
