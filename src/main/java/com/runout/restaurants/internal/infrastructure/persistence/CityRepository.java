package com.runout.restaurants.internal.infrastructure.persistence;

import com.runout.restaurants.internal.infrastructure.persistence.entity.CityEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CityRepository extends JpaRepository<CityEntity, UUID> {
    Optional<CityEntity> findByNameIgnoreCase(String name);
}
