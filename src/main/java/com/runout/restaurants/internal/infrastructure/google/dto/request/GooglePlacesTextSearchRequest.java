package com.runout.restaurants.internal.infrastructure.google.dto.request;

import lombok.Builder;

@Builder
public record GooglePlacesTextSearchRequest(
        String textQuery,
        String includedType,
        String languageCode,
        String regionCode,
        Integer pageSize
) {
}
