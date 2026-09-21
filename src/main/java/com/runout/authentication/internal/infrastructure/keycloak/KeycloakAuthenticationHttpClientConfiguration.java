package com.runout.authentication.internal.infrastructure.keycloak;

import com.runout.shared.HttpExchangeClientFactory;
import com.runout.shared.KeycloakProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class KeycloakAuthenticationHttpClientConfiguration {

    @Bean
    KeycloakAuthenticationHttpClient keycloakAuthenticationHttpClient(KeycloakProperties keycloakProperties) {
        return HttpExchangeClientFactory.create(
                keycloakProperties.baseUrl(),
                KeycloakAuthenticationHttpClient.class
        );
    }
}
