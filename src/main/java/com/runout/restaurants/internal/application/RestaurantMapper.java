package com.runout.restaurants.internal.application;

import com.runout.restaurants.api.CreateRestaurantCommand;
import com.runout.restaurants.api.GooglePlaceCandidate;
import com.runout.restaurants.api.RestaurantSummary;
import com.runout.restaurants.internal.infrastructure.persistence.entity.RestaurantEntity;
import com.runout.restaurants.internal.infrastructure.persistence.entity.CityEntity;

final class RestaurantMapper {

    private RestaurantMapper() {
    }

    static RestaurantSummary toSummary(RestaurantEntity restaurant) {
        return RestaurantSummary.builder()
                .id(restaurant.getId())
                .name(restaurant.getName())
                .phone(restaurant.getPhone())
                .active(restaurant.isActive())
                .cuisine(restaurant.getCuisine())
                .priceTier(restaurant.getPriceTier())
                .description(restaurant.getDescription())
                .openingHours(restaurant.getOpeningHours())
                .tags(restaurant.getTags())
                .googlePlaceId(restaurant.getGooglePlaceId())
                .formattedAddress(restaurant.getFormattedAddress())
                .cityId(restaurant.getCity().getId())
                .cityName(restaurant.getCity().getName())
                .area(restaurant.getArea())
                .latitude(restaurant.getLatitude())
                .longitude(restaurant.getLongitude())
                .rating(restaurant.getRating())
                .userRatingCount(restaurant.getUserRatingCount())
                .websiteUri(restaurant.getWebsiteUri())
                .googleMapsUri(restaurant.getGoogleMapsUri())
                .primaryType(restaurant.getPrimaryType())
                .types(restaurant.getTypes())
                .menus(restaurant.getMenus())
                .build();
    }

    static RestaurantEntity toEntity(CreateRestaurantCommand command, CityEntity city) {
        return RestaurantEntity.builder()
                .name(command.name())
                .phone(command.phone())
                .cuisine(command.cuisine())
                .priceTier(command.priceTier())
                .description(command.description())
                .openingHours(command.openingHours())
                .tags(command.tags())
                .googlePlaceId(command.googlePlaceId())
                .formattedAddress(command.formattedAddress())
                .city(city)
                .area(command.area())
                .latitude(command.latitude())
                .longitude(command.longitude())
                .rating(command.rating())
                .userRatingCount(command.userRatingCount())
                .websiteUri(command.websiteUri())
                .googleMapsUri(command.googleMapsUri())
                .primaryType(command.primaryType())
                .types(command.types())
                .menus(command.menus())
                .build();
    }

    static CreateRestaurantCommand toCreateCommand(GooglePlaceCandidate candidate) {
        return CreateRestaurantCommand.builder()
                .name(candidate.name())
                .phone(candidate.phone())
                .cuisine(candidate.primaryType())
                .priceTier(null)
                .description(null)
                .openingHours(null)
                .tags(candidate.types())
                .googlePlaceId(candidate.googlePlaceId())
                .formattedAddress(candidate.formattedAddress())
                .cityId(candidate.cityId())
                .area(candidate.area())
                .latitude(candidate.latitude())
                .longitude(candidate.longitude())
                .rating(candidate.rating())
                .userRatingCount(candidate.userRatingCount())
                .websiteUri(candidate.websiteUri())
                .googleMapsUri(candidate.googleMapsUri())
                .primaryType(candidate.primaryType())
                .types(candidate.types())
                .menus(null)
                .build();
    }
}
