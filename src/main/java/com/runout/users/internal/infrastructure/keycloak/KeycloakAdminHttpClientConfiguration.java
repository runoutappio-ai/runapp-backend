package com.runout.users.internal.infrastructure.keycloak;

import com.runout.shared.HttpExchangeClientFactory;
import com.runout.shared.KeycloakProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.service.invoker.HttpServiceProxyFactory;

@Configuration(proxyBeanMethods = false)
class KeycloakAdminHttpClientConfiguration {

    @Bean
    HttpServiceProxyFactory keycloakHttpServiceProxyFactory(KeycloakProperties keycloakProperties) {
        return HttpExchangeClientFactory.createProxyFactory(keycloakProperties.baseUrl());
    }

    @Bean
    KeycloakAdminHttpClient keycloakAdminHttpClient(HttpServiceProxyFactory keycloakHttpServiceProxyFactory) {
        return keycloakHttpServiceProxyFactory.createClient(KeycloakAdminHttpClient.class);
    }

    @Bean
    KeycloakTokenHttpClient keycloakTokenHttpClient(HttpServiceProxyFactory keycloakHttpServiceProxyFactory) {
        return keycloakHttpServiceProxyFactory.createClient(KeycloakTokenHttpClient.class);
    }
}
