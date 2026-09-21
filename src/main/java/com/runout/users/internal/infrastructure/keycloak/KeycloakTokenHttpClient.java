package com.runout.users.internal.infrastructure.keycloak;

import com.runout.shared.KeycloakTokenRequest;
import com.runout.users.internal.infrastructure.keycloak.dto.response.KeycloakAccessTokenResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;

@HttpExchange("/realms/runout/protocol/openid-connect")
public interface KeycloakTokenHttpClient {

    default KeycloakAccessTokenResponse serviceAccessToken(KeycloakTokenRequest request) {
        return serviceAccessToken(request.grantType(), request.clientId(), request.clientSecret());
    }

    @PostExchange(value = "/token", contentType = MediaType.APPLICATION_FORM_URLENCODED_VALUE)
    KeycloakAccessTokenResponse serviceAccessToken(
            @RequestParam("grant_type") String grantType,
            @RequestParam("client_id") String clientId,
            @RequestParam("client_secret") String clientSecret
    );
}
