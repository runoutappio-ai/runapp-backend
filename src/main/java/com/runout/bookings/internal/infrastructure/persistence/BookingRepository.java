package com.runout.bookings.internal.infrastructure.persistence;

import com.runout.bookings.internal.infrastructure.persistence.entity.BookingEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
public interface BookingRepository extends JpaRepository<BookingEntity, UUID> {
}
