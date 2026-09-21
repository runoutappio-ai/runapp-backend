package com.runout.restaurants.internal.infrastructure.google;

import com.runout.restaurants.internal.infrastructure.google.dto.request.GooglePlacesTextSearchRequest;
import com.runout.restaurants.internal.infrastructure.google.dto.response.GooglePlacesTextSearchResponse;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;

@HttpExchange("/v1")
public interface GooglePlacesHttpClient {

    @PostExchange(value = "/places:searchText", contentType = MediaType.APPLICATION_JSON_VALUE)
    GooglePlacesTextSearchResponse searchText(
            @RequestHeader("X-Goog-Api-Key") String apiKey,
            @RequestHeader("X-Goog-FieldMask") String fieldMask,
            @RequestBody GooglePlacesTextSearchRequest request
    );
}
