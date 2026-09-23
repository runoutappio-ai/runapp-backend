package com.runout.bookings.internal.infrastructure.persistence;

import com.runout.bookings.internal.infrastructure.persistence.entity.ReservationEntity;
import com.runout.bookings.internal.domain.ReservationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<ReservationEntity, UUID> {

    Optional<ReservationEntity> findByUserIdAndIdempotencyKey(UUID userId, UUID idempotencyKey);

    Optional<ReservationEntity> findByIdAndUserId(UUID id, UUID userId);

    List<ReservationEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId);

    List<ReservationEntity> findAllByPaymentStatusOrderByCreatedAtDesc(String paymentStatus);

    @Query("""
            select reservation from ReservationEntity reservation
            where reservation.assignedEmployeeId = :employeeId
               or (reservation.status = :unassignedStatus and reservation.assignedEmployeeId is null)
            order by reservation.createdAt desc
            """)
    List<ReservationEntity> findAllVisibleToEmployee(UUID employeeId, ReservationStatus unassignedStatus);
}
