package com.runout.shared;

public record KeycloakTokenRequest(
        String grantType,
        String clientId,
        String clientSecret,
        String username,
        String password,
        String refreshToken,
        String scope
) {

    public static KeycloakTokenRequest password(KeycloakProperties properties,
                                                String username,
                                                String password) {
        return new KeycloakTokenRequest(
                "password",
                properties.authenticationClientId(),
                properties.authenticationClientSecret(),
                username,
                password,
                null,
                "openid"
        );
    }

    public static KeycloakTokenRequest refreshToken(KeycloakProperties properties,
                                                    String refreshToken) {
        return new KeycloakTokenRequest(
                "refresh_token",
                properties.authenticationClientId(),
                properties.authenticationClientSecret(),
                null,
                null,
                refreshToken,
                null
        );
    }

    public static KeycloakTokenRequest clientCredentials(KeycloakProperties properties) {
        return new KeycloakTokenRequest(
                "client_credentials",
                properties.registrationClientId(),
                properties.registrationClientSecret(),
                null,
                null,
                null,
                null
        );
    }
}
