package com.runout.restaurants.internal.application;

import com.runout.restaurants.api.GooglePlaceCandidate;
import com.runout.restaurants.api.SearchGooglePlacesCommand;

import java.util.List;

public interface GooglePlacesGateway {
    List<GooglePlaceCandidate> search(SearchGooglePlacesCommand command);
}
