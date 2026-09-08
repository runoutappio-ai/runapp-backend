package com.runout.restaurants.internal.application;

import com.runout.restaurants.api.RestaurantSummary;
import com.runout.restaurants.api.Restaurants;
import com.runout.restaurants.internal.infrastructure.persistence.RestaurantRepository;
import com.runout.restaurants.internal.infrastructure.persistence.entity.RestaurantEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
class RestaurantManagement implements Restaurants {
    private final RestaurantRepository repository;

    public RestaurantSummary requireActive(UUID id) {
        var value = repository.findById(id).filter(RestaurantEntity::isActive).orElseThrow(() -> new IllegalArgumentException("Active restaurant not found: " + id));
        return new RestaurantSummary(value.getId(), value.getName(), value.getPhone());
    }
}
