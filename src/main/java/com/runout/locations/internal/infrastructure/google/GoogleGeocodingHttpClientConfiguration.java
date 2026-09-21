package com.runout.locations.internal.infrastructure.google;

import com.runout.shared.GoogleMapsProperties;
import com.runout.shared.HttpExchangeClientFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
class GoogleGeocodingHttpClientConfiguration {

    @Bean
    GoogleGeocodingHttpClient googleGeocodingHttpClient(GoogleMapsProperties googleMapsProperties) {
        return HttpExchangeClientFactory.create(
                googleMapsProperties.geocodingBaseUrl(),
                GoogleGeocodingHttpClient.class
        );
    }
}
