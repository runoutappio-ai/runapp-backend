package com.runout.bookings.internal.infrastructure.persistence.entity;

import com.runout.bookings.internal.domain.BookingStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "booking")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BookingEntity {

    @Id
    private UUID id;
    private UUID experienceId;
    private UUID restaurantId;
    private UUID groupId;
    private String externalReference;
    private Instant reservedAt;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    public BookingEntity(UUID experienceId, UUID restaurantId, UUID groupId, String reference, Instant reservedAt) {
        this.id = UUID.randomUUID();
        this.experienceId = experienceId;
        this.restaurantId = restaurantId;
        this.groupId = groupId;
        this.externalReference = reference;
        this.reservedAt = reservedAt;
        this.status = BookingStatus.PENDING;
    }

    public void confirm() {
        if (status != BookingStatus.PENDING) {
            throw new IllegalStateException("Booking is not pending");
        }

        status = BookingStatus.CONFIRMED;
    }
}
