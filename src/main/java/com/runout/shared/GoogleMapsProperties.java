package com.runout.shared;

import jakarta.validation.constraints.NotBlank;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("runout.google.maps")
public record GoogleMapsProperties(
        @NotBlank String baseUrl,
        @NotBlank String geocodingBaseUrl,
        String apiKey
) {
}
