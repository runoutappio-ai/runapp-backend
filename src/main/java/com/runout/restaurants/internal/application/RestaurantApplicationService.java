package com.runout.restaurants.internal.application;

import com.runout.restaurants.api.*;
import com.runout.restaurants.internal.infrastructure.persistence.RestaurantRepository;
import com.runout.restaurants.internal.infrastructure.persistence.CityRepository;
import com.runout.restaurants.internal.infrastructure.persistence.entity.RestaurantEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class RestaurantApplicationService implements RestaurantService {

    private final RestaurantRepository repository;
    private final CityRepository cities;
    private final GooglePlacesGateway googlePlaces;

    @Override
    public List<RestaurantSummary> findAll() {
        return repository.findAll()
                .stream()
                .map(RestaurantMapper::toSummary)
                .toList();
    }

    @Override
    public List<RestaurantSummary> findAllActive() {
        return repository.findAll()
                .stream()
                .filter(RestaurantEntity::isActive)
                .map(RestaurantMapper::toSummary)
                .toList();
    }

    @Override
    public RestaurantSummary findById(UUID restaurantId) {
        return RestaurantMapper.toSummary(repository.findById(restaurantId).orElseThrow());
    }

    @Override
    public RestaurantSummary requireActive(UUID id) {
        var restaurant = repository.findById(id)
                .filter(RestaurantEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Active restaurant not found: " + id));

        return RestaurantMapper.toSummary(restaurant);
    }

    @Override
    public List<RestaurantMenuSummary> findMenu(UUID restaurantId) {
        return repository.findById(restaurantId).orElseThrow().getMenus();
    }

    @Override
    public List<GooglePlaceCandidate> searchGooglePlaces(SearchGooglePlacesCommand command) {
        return googlePlaces.search(command);
    }

    @Override
    @Transactional
    public RestaurantSummary importGooglePlace(GooglePlaceCandidate candidate) {
        var existing = repository.findByGooglePlaceId(candidate.googlePlaceId());
        var city = requireCity(candidate.cityId());
        if (existing.isPresent()) {
            var restaurant = existing.get();
            restaurant.update(candidate.name(), candidate.phone(), candidate.primaryType(), restaurant.getPriceTier(),
                    restaurant.getDescription(), restaurant.getOpeningHours(), candidate.types(),
                    candidate.googlePlaceId(), candidate.formattedAddress(), city, candidate.area(),
                    candidate.latitude(), candidate.longitude(), candidate.rating(), candidate.userRatingCount(),
                    candidate.websiteUri(), candidate.googleMapsUri(), candidate.primaryType(), candidate.types(),
                    restaurant.getMenus());
            restaurant.activate();
            return RestaurantMapper.toSummary(restaurant);
        }

        var restaurant = repository.save(RestaurantMapper.toEntity(RestaurantMapper.toCreateCommand(candidate), city));
        return RestaurantMapper.toSummary(restaurant);
    }

    @Override
    @Transactional
    public RestaurantSummary create(CreateRestaurantCommand command) {
        var restaurant = repository.save(RestaurantMapper.toEntity(command, requireCity(command.cityId())));
        return RestaurantMapper.toSummary(restaurant);
    }

    @Override
    @Transactional
    public RestaurantSummary update(UpdateRestaurantCommand command) {
        var restaurant = repository.findById(command.id()).orElseThrow();
        var city = requireCity(command.cityId());
        restaurant.update(command.name(), command.phone(), command.cuisine(), command.priceTier(), command.description(),
                command.openingHours(), command.tags(), command.googlePlaceId(), command.formattedAddress(), city,
                command.area(),
                command.latitude(), command.longitude(), command.rating(), command.userRatingCount(),
                command.websiteUri(), command.googleMapsUri(), command.primaryType(), command.types(), command.menus());
        return RestaurantMapper.toSummary(restaurant);
    }

    @Override
    @Transactional
    public void activate(UUID restaurantId) {
        var restaurant = repository.findById(restaurantId).orElseThrow();
        restaurant.activate();
    }

    @Override
    @Transactional
    public void deactivate(UUID restaurantId) {
        var restaurant = repository.findById(restaurantId).orElseThrow();
        restaurant.deactivate();
    }

    private com.runout.restaurants.internal.infrastructure.persistence.entity.CityEntity requireCity(UUID cityId) {
        return cities.findById(cityId)
                .filter(com.runout.restaurants.internal.infrastructure.persistence.entity.CityEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Active city not found: " + cityId));
    }
}
