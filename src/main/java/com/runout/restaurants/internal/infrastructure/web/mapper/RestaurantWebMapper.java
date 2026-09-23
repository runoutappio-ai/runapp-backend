package com.runout.restaurants.internal.infrastructure.web.mapper;

import com.runout.restaurants.api.CreateRestaurantCommand;
import com.runout.restaurants.api.GooglePlaceCandidate;
import com.runout.restaurants.api.RestaurantMenuSummary;
import com.runout.restaurants.api.SearchGooglePlacesCommand;
import com.runout.restaurants.api.UpdateRestaurantCommand;
import com.runout.restaurants.internal.infrastructure.web.dto.request.CreateRestaurantRequest;
import com.runout.restaurants.internal.infrastructure.web.dto.request.ImportGooglePlaceRequest;
import com.runout.restaurants.internal.infrastructure.web.dto.request.UpdateRestaurantRequest;

import java.util.List;
import java.util.UUID;

public final class RestaurantWebMapper {

    private RestaurantWebMapper() {
    }

    public static CreateRestaurantCommand toCommand(CreateRestaurantRequest request) {
        return CreateRestaurantCommand.builder()
                .name(request.name())
                .phone(request.phone())
                .cuisine(request.cuisine())
                .priceTier(request.priceTier())
                .description(request.description())
                .openingHours(request.openingHours())
                .tags(request.tags())
                .googlePlaceId(request.googlePlaceId())
                .formattedAddress(request.formattedAddress())
                .cityId(request.cityId())
                .area(request.area())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .rating(request.rating())
                .userRatingCount(request.userRatingCount())
                .websiteUri(request.websiteUri())
                .googleMapsUri(request.googleMapsUri())
                .primaryType(request.primaryType())
                .types(request.types())
                .menus(toMenus(request.menus()))
                .build();
    }

    public static UpdateRestaurantCommand toCommand(UUID id, UpdateRestaurantRequest request) {
        return UpdateRestaurantCommand.builder()
                .id(id)
                .name(request.name())
                .phone(request.phone())
                .cuisine(request.cuisine())
                .priceTier(request.priceTier())
                .description(request.description())
                .openingHours(request.openingHours())
                .tags(request.tags())
                .googlePlaceId(request.googlePlaceId())
                .formattedAddress(request.formattedAddress())
                .cityId(request.cityId())
                .area(request.area())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .rating(request.rating())
                .userRatingCount(request.userRatingCount())
                .websiteUri(request.websiteUri())
                .googleMapsUri(request.googleMapsUri())
                .primaryType(request.primaryType())
                .types(request.types())
                .menus(toMenusFromUpdate(request.menus()))
                .build();
    }

    public static SearchGooglePlacesCommand toSearchCommand(String query, String languageCode, String regionCode) {
        return SearchGooglePlacesCommand.builder()
                .query(query)
                .languageCode(languageCode)
                .regionCode(regionCode)
                .build();
    }

    public static GooglePlaceCandidate toCandidate(ImportGooglePlaceRequest request) {
        return GooglePlaceCandidate.builder()
                .googlePlaceId(request.googlePlaceId())
                .name(request.name())
                .formattedAddress(request.formattedAddress())
                .cityId(request.cityId())
                .area(request.area())
                .phone(request.phone())
                .primaryType(request.cuisine() == null ? request.primaryType() : request.cuisine())
                .types(request.tags() == null ? request.types() : request.tags())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .rating(request.rating())
                .userRatingCount(request.userRatingCount())
                .websiteUri(request.websiteUri())
                .googleMapsUri(request.googleMapsUri())
                .build();
    }

    private static List<RestaurantMenuSummary> toMenus(List<CreateRestaurantRequest.MenuRequest> menus) {
        if (menus == null) {
            return List.of();
        }
        return menus.stream()
                .map(menu -> RestaurantMenuSummary.builder()
                        .id(menu.id())
                        .entries(menu.entries())
                        .build())
                .toList();
    }

    private static List<RestaurantMenuSummary> toMenusFromUpdate(List<UpdateRestaurantRequest.MenuRequest> menus) {
        if (menus == null) {
            return List.of();
        }
        return menus.stream()
                .map(menu -> RestaurantMenuSummary.builder()
                        .id(menu.id())
                        .entries(menu.entries())
                        .build())
                .toList();
    }
}
