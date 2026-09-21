package com.runout.restaurants.api;

import java.util.List;
import java.util.UUID;

public interface RestaurantService {
    List<RestaurantSummary> findAll();

    List<RestaurantSummary> findAllActive();

    RestaurantSummary findById(UUID restaurantId);

    RestaurantSummary requireActive(UUID restaurantId);

    List<RestaurantMenuSummary> findMenu(UUID restaurantId);

    List<GooglePlaceCandidate> searchGooglePlaces(SearchGooglePlacesCommand command);

    RestaurantSummary importGooglePlace(GooglePlaceCandidate candidate);

    RestaurantSummary create(CreateRestaurantCommand command);

    RestaurantSummary update(UpdateRestaurantCommand command);

    void activate(UUID restaurantId);

    void deactivate(UUID restaurantId);
}
