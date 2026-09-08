package com.runout.restaurants.internal.infrastructure.persistence.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "restaurant")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class RestaurantEntity {

    @Id
    private UUID id;
    private String name;
    private String phone;
    private boolean active;
}
