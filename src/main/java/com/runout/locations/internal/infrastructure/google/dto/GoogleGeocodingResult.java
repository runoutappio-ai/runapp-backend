package com.runout.locations.internal.infrastructure.google.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record GoogleGeocodingResult(
        @JsonProperty("formatted_address") String formattedAddress,
        @JsonProperty("place_id") String placeId,
        Geometry geometry
) {
    public record Geometry(Location location) {
    }

    public record Location(Double lat, Double lng) {
    }
}
