package com.runout.restaurants.internal.infrastructure.google;

import com.runout.shared.GoogleMapsProperties;
import com.runout.shared.HttpExchangeClientFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class GooglePlacesHttpClientConfiguration {

    @Bean
    GooglePlacesHttpClient googlePlacesHttpClient(GoogleMapsProperties googleMapsProperties) {
        return HttpExchangeClientFactory.create(
                googleMapsProperties.baseUrl(),
                GooglePlacesHttpClient.class
        );
    }
}
