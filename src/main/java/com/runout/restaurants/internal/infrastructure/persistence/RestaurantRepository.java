package com.runout.restaurants.internal.infrastructure.persistence;

import com.runout.restaurants.internal.infrastructure.persistence.entity.RestaurantEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RestaurantRepository extends JpaRepository<RestaurantEntity, UUID> {
}
