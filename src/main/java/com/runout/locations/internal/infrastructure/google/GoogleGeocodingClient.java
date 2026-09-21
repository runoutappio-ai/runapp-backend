package com.runout.locations.internal.infrastructure.google;

import com.runout.locations.internal.infrastructure.google.dto.GoogleGeocodingResponse;
import com.runout.locations.internal.infrastructure.web.dto.LocationCandidateResponse;
import com.runout.shared.GoogleMapsProperties;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Component
public class GoogleGeocodingClient {

    private final GoogleGeocodingHttpClient geocodingHttpClient;
    private final GoogleMapsProperties googleMapsProperties;

    GoogleGeocodingClient(GoogleGeocodingHttpClient geocodingHttpClient,
                          GoogleMapsProperties googleMapsProperties) {
        this.geocodingHttpClient = geocodingHttpClient;
        this.googleMapsProperties = googleMapsProperties;
    }

    public List<LocationCandidateResponse> search(String query) {
        requireApiKey();
        try {
            var response = geocodingHttpClient.geocode(query, googleMapsProperties.apiKey());

            return toCandidates(response);
        } catch (RestClientResponseException error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google geocoding failed", error);
        }
    }

    public LocationCandidateResponse reverse(BigDecimal latitude, BigDecimal longitude) {
        requireApiKey();
        try {
            var response = geocodingHttpClient.reverseGeocode(
                    latitude + "," + longitude,
                    googleMapsProperties.apiKey()
            );

            return toCandidates(response).stream().findFirst()
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Address not found"));
        } catch (RestClientResponseException error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google reverse geocoding failed", error);
        }
    }

    private List<LocationCandidateResponse> toCandidates(GoogleGeocodingResponse response) {
        if (response == null || response.results() == null) {
            return List.of();
        }

        return response.results().stream()
                .filter(result -> result.geometry() != null && result.geometry().location() != null)
                .map(result -> {
                    var location = result.geometry().location();
                    return LocationCandidateResponse.builder()
                            .label(result.formattedAddress())
                            .placeId(result.placeId())
                            .latitude(BigDecimal.valueOf(location.lat()))
                            .longitude(BigDecimal.valueOf(location.lng()))
                            .build();
                })
                .toList();
    }

    private void requireApiKey() {
        if (googleMapsProperties.apiKey() == null || googleMapsProperties.apiKey().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google Maps API key is not configured");
        }
    }
}
