package com.runout.restaurants.internal.infrastructure.google.dto.response;

import java.util.List;

public record GooglePlacesTextSearchResponse(List<GooglePlaceResponse> places) {
}
