package com.runout.restaurants.internal.infrastructure.web;

import com.runout.restaurants.api.GooglePlaceCandidate;
import com.runout.restaurants.api.RestaurantMenuSummary;
import com.runout.restaurants.api.RestaurantService;
import com.runout.restaurants.api.RestaurantSummary;
import com.runout.restaurants.internal.infrastructure.web.dto.request.CreateRestaurantRequest;
import com.runout.restaurants.internal.infrastructure.web.dto.request.ImportGooglePlaceRequest;
import com.runout.restaurants.internal.infrastructure.web.dto.request.UpdateRestaurantRequest;
import com.runout.restaurants.internal.infrastructure.web.mapper.RestaurantWebMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequiredArgsConstructor
class RestaurantController {

    private final RestaurantService restaurants;

    @GetMapping("/api/v1/restaurants")
    List<RestaurantSummary> findActiveRestaurants() {
        log.info("Listing active restaurants");
        return restaurants.findAllActive();
    }

    @GetMapping("/api/v1/restaurants/{id}")
    RestaurantSummary findActiveRestaurant(@PathVariable UUID id) {
        log.info("Retrieving active restaurant id={}", id);
        return restaurants.requireActive(id);
    }

    @GetMapping("/api/v1/restaurants/{id}/menu")
    List<RestaurantMenuSummary> findActiveRestaurantMenu(@PathVariable UUID id) {
        log.info("Retrieving active restaurant menu restaurantId={}", id);
        restaurants.requireActive(id);
        return restaurants.findMenu(id);
    }

    @GetMapping("/api/admin/restaurants")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'WORKER')")
    List<RestaurantSummary> findRestaurants() {
        log.info("Admin listing restaurants");
        return restaurants.findAll();
    }

    @GetMapping("/api/admin/restaurants/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'WORKER')")
    RestaurantSummary findRestaurant(@PathVariable UUID id) {
        log.info("Admin retrieving restaurant id={}", id);
        return restaurants.findById(id);
    }

    @GetMapping("/api/admin/restaurants/{id}/menu")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'WORKER')")
    List<RestaurantMenuSummary> findRestaurantMenu(@PathVariable UUID id) {
        log.info("Admin retrieving restaurant menu restaurantId={}", id);
        return restaurants.findMenu(id);
    }

    @GetMapping("/api/admin/restaurants/google-places/search")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'WORKER')")
    List<GooglePlaceCandidate> searchGooglePlaces(@RequestParam @NotBlank String query,
                                                  @RequestParam(defaultValue = "es") String languageCode,
                                                  @RequestParam(defaultValue = "ES") String regionCode) {
        log.info("Admin searching Google Places query={} languageCode={} regionCode={}", query, languageCode, regionCode);
        return restaurants.searchGooglePlaces(RestaurantWebMapper.toSearchCommand(query, languageCode, regionCode));
    }

    @PostMapping("/api/admin/restaurants/google-places/import")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'WORKER')")
    RestaurantSummary importGooglePlace(@Valid @RequestBody ImportGooglePlaceRequest request) {
        log.info("Admin importing Google Place googlePlaceId={}", request.googlePlaceId());
        return restaurants.importGooglePlace(RestaurantWebMapper.toCandidate(request));
    }

    @PostMapping("/api/admin/restaurants")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'WORKER')")
    RestaurantSummary createRestaurant(@Valid @RequestBody CreateRestaurantRequest request) {
        log.info("Admin creating restaurant name={}", request.name());
        return restaurants.create(RestaurantWebMapper.toCommand(request));
    }

    @PatchMapping("/api/admin/restaurants/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER')")
    RestaurantSummary updateRestaurant(@PathVariable UUID id, @Valid @RequestBody UpdateRestaurantRequest request) {
        log.info("Admin updating restaurant id={}", id);
        return restaurants.update(RestaurantWebMapper.toCommand(id, request));
    }

    @PostMapping("/api/admin/restaurants/{id}/activation")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER')")
    void activateRestaurant(@PathVariable UUID id) {
        log.info("Admin activating restaurant id={}", id);
        restaurants.activate(id);
    }

    @PostMapping("/api/admin/restaurants/{id}/deactivation")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER')")
    void deactivateRestaurant(@PathVariable UUID id) {
        log.info("Admin deactivating restaurant id={}", id);
        restaurants.deactivate(id);
    }
}
