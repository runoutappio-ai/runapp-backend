package com.runout.locations.internal.infrastructure.web;

import com.runout.locations.internal.infrastructure.google.GoogleGeocodingClient;
import com.runout.locations.internal.infrastructure.web.dto.LocationCandidateResponse;
import com.runout.locations.internal.infrastructure.web.dto.ReverseGeocodeRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Slf4j
class LocationController {

    private final GoogleGeocodingClient geocoding;

    @GetMapping("/api/v1/locations/search")
    List<LocationCandidateResponse> search(@RequestParam @NotBlank String query) {
        log.info("Searching locations query={}", query);
        return geocoding.search(query);
    }

    @PostMapping("/api/v1/locations/reverse-geocode")
    LocationCandidateResponse reverse(@Valid @RequestBody ReverseGeocodeRequest request) {
        log.info("Reverse geocoding latitude={} longitude={}", request.latitude(), request.longitude());
        return geocoding.reverse(request.latitude(), request.longitude());
    }
}
