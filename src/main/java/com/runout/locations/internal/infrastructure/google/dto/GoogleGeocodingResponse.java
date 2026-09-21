package com.runout.locations.internal.infrastructure.google.dto;

import java.util.List;

public record GoogleGeocodingResponse(List<GoogleGeocodingResult> results, String status) {
}
