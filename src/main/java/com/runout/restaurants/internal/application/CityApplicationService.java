package com.runout.restaurants.internal.application;

import com.runout.restaurants.api.CityService;
import com.runout.restaurants.api.CitySummary;
import com.runout.restaurants.api.CreateCityCommand;
import com.runout.restaurants.internal.infrastructure.persistence.CityRepository;
import com.runout.restaurants.internal.infrastructure.persistence.entity.CityEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class CityApplicationService implements CityService {

    private final CityRepository cities;

    @Override
    public List<CitySummary> findAll() {
        return cities.findAll().stream()
                .filter(CityEntity::isActive)
                .sorted(java.util.Comparator.comparing(CityEntity::getName))
                .map(CityApplicationService::toSummary)
                .toList();
    }

    @Override
    @Transactional
    public CitySummary create(CreateCityCommand command) {
        cities.findByNameIgnoreCase(command.name()).ifPresent(existing -> {
            throw new IllegalArgumentException("City already exists: " + existing.getName());
        });
        return toSummary(cities.save(new CityEntity(command.name(), command.countryCode())));
    }

    @Override
    public CitySummary findById(UUID id) {
        var city = cities.findById(id)
                .filter(CityEntity::isActive)
                .orElseThrow(() -> new IllegalArgumentException("Active city not found: " + id));
        return toSummary(city);
    }

    private static CitySummary toSummary(CityEntity city) {
        return new CitySummary(city.getId(), city.getName(), city.getCountryCode());
    }
}
