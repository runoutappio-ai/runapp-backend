package com.runout.restaurants.internal.infrastructure.web;

import com.runout.restaurants.api.CityService;
import com.runout.restaurants.api.CitySummary;
import com.runout.restaurants.api.CreateCityCommand;
import com.runout.restaurants.internal.infrastructure.web.dto.request.CreateCityRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin/cities")
class CityController {

    private final CityService cities;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'MANAGER', 'WORKER')")
    List<CitySummary> findCities() {
        return cities.findAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    CitySummary createCity(@Valid @RequestBody CreateCityRequest request) {
        return cities.create(new CreateCityCommand(request.name(), request.countryCode()));
    }
}
