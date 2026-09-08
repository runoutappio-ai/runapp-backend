package com.runout.bookings.internal.infrastructure.persistence;

import com.runout.bookings.internal.infrastructure.persistence.entity.ReservationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<ReservationEntity, UUID> {

    Optional<ReservationEntity> findByUserIdAndIdempotencyKey(UUID userId, String idempotencyKey);
}
