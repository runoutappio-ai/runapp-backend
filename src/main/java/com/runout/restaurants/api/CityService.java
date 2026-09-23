package com.runout.restaurants.api;

import java.util.List;
import java.util.UUID;

public interface CityService {
    List<CitySummary> findAll();

    CitySummary create(CreateCityCommand command);

    CitySummary findById(UUID id);
}
