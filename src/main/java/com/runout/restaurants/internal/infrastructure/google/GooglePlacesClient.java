package com.runout.restaurants.internal.infrastructure.google;

import com.runout.restaurants.api.GooglePlaceCandidate;
import com.runout.restaurants.api.SearchGooglePlacesCommand;
import com.runout.restaurants.internal.application.GooglePlacesGateway;
import com.runout.shared.GoogleMapsProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Component
@RequiredArgsConstructor
class GooglePlacesClient implements GooglePlacesGateway {

    private static final String FIELD_MASK = String.join(",",
            "places.id",
            "places.displayName",
            "places.formattedAddress",
            "places.nationalPhoneNumber",
            "places.location",
            "places.rating",
            "places.userRatingCount",
            "places.websiteUri",
            "places.googleMapsUri",
            "places.primaryType",
            "places.types"
    );

    private final GooglePlacesHttpClient placesHttpClient;
    private final GoogleMapsProperties googleMapsProperties;

    @Override
    public List<GooglePlaceCandidate> search(SearchGooglePlacesCommand command) {
        if (googleMapsProperties.apiKey() == null || googleMapsProperties.apiKey().isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Google Maps API key is not configured");
        }

        try {
            var response = placesHttpClient.searchText(
                    googleMapsProperties.apiKey(),
                    FIELD_MASK,
                    GooglePlacesMapper.toTextSearchRequest(command)
            );

            if (response == null || response.places() == null) {
                return List.of();
            }

            return response.places().stream()
                    .map(GooglePlacesMapper::toCandidate)
                    .toList();
        } catch (RestClientResponseException error) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Google Places search failed", error);
        }
    }
}
