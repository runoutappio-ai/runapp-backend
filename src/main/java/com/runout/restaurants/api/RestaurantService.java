package com.runout.restaurants.api;

import java.util.List;
import java.util.UUID;

public interface RestaurantService {
    List<RestaurantSummary> findAll();

    List<RestaurantSummary> findAllActive();

    RestaurantSummary findById(UUID restaurantId);

    RestaurantSummary findByOwnerUserId(UUID ownerUserId);

    RestaurantSummary requireActive(UUID restaurantId);

    List<RestaurantMenuSummary> findMenu(UUID restaurantId);

    List<GooglePlaceCandidate> searchGooglePlaces(SearchGooglePlacesCommand command);

    RestaurantSummary importGooglePlace(GooglePlaceCandidate candidate);

    RestaurantSummary create(CreateRestaurantCommand command);

    RestaurantSummary update(UpdateRestaurantCommand command);

    RestaurantSummary updatePortal(UpdateRestaurantPortalCommand command);

    RestaurantSummary updatePortalMenus(UUID ownerUserId, List<RestaurantMenuSummary> menus, Integer priceTier);

    RestaurantSummary reviewMenus(UUID restaurantId, boolean approved);

    RestaurantSummary cancelMenuSubmission(UUID ownerUserId);

    RestaurantSummary assignOwner(UUID restaurantId, UUID ownerUserId);

    void activate(UUID restaurantId);

    void deactivate(UUID restaurantId);
}
