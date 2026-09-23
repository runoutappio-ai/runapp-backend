package com.runout.restaurants.internal.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Locale;
import java.util.UUID;

@Entity
@Table(name = "city")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CityEntity {

    @Id
    private UUID id;
    private String name;
    private String countryCode;
    private boolean active;

    public CityEntity(String name, String countryCode) {
        this.id = UUID.randomUUID();
        this.name = name.trim();
        this.countryCode = countryCode.trim().toUpperCase(Locale.ROOT);
        this.active = true;
    }
}
