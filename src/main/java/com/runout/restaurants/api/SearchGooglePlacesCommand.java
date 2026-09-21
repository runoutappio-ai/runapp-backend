package com.runout.restaurants.api;

import lombok.Builder;

@Builder
public record SearchGooglePlacesCommand(String query, String languageCode, String regionCode) {
}
