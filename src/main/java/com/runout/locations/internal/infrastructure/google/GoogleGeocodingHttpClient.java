package com.runout.locations.internal.infrastructure.google;

import com.runout.locations.internal.infrastructure.google.dto.GoogleGeocodingResponse;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;

@HttpExchange("/maps/api/geocode")
public interface GoogleGeocodingHttpClient {

    @GetExchange("/json")
    GoogleGeocodingResponse geocode(@RequestParam String address, @RequestParam String key);

    @GetExchange("/json")
    GoogleGeocodingResponse reverseGeocode(@RequestParam String latlng, @RequestParam String key);
}
