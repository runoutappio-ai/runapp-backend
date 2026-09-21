package com.runout.shared;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

@Validated
@ConfigurationProperties("runout.identity.keycloak")
public record KeycloakProperties(
        @NotBlank String baseUrl,
        @NotBlank String realm,
        @NotBlank String registrationClientId,
        @NotBlank String registrationClientSecret,
        @NotBlank String authenticationClientId,
        @NotBlank String authenticationClientSecret
) {
}
