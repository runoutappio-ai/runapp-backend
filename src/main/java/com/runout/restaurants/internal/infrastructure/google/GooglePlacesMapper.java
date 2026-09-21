package com.runout.restaurants.internal.infrastructure.google;

import com.runout.restaurants.api.GooglePlaceCandidate;
import com.runout.restaurants.api.SearchGooglePlacesCommand;
import com.runout.restaurants.internal.infrastructure.google.dto.request.GooglePlacesTextSearchRequest;
import com.runout.restaurants.internal.infrastructure.google.dto.response.GooglePlaceResponse;

public final class GooglePlacesMapper {

    private GooglePlacesMapper() {
    }

    public static GooglePlacesTextSearchRequest toTextSearchRequest(SearchGooglePlacesCommand command) {
        return GooglePlacesTextSearchRequest.builder()
                .textQuery(command.query())
                .includedType("restaurant")
                .languageCode(command.languageCode())
                .regionCode(command.regionCode())
                .pageSize(8)
                .build();
    }

    public static GooglePlaceCandidate toCandidate(GooglePlaceResponse place) {
        var location = place.location();
        return GooglePlaceCandidate.builder()
                .googlePlaceId(place.id())
                .name(place.displayName() == null ? null : place.displayName().text())
                .formattedAddress(place.formattedAddress())
                .phone(place.nationalPhoneNumber())
                .latitude(location == null ? null : location.latitude())
                .longitude(location == null ? null : location.longitude())
                .rating(place.rating())
                .userRatingCount(place.userRatingCount())
                .websiteUri(place.websiteUri())
                .googleMapsUri(place.googleMapsUri())
                .primaryType(place.primaryType())
                .types(place.types())
                .build();
    }
}
