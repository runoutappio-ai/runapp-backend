package com.runout.bookings.internal.infrastructure.persistence;

import com.runout.bookings.internal.infrastructure.persistence.entity.ReservationEntity;
import com.runout.bookings.internal.domain.ReservationStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ReservationRepository extends JpaRepository<ReservationEntity, UUID> {

    Optional<ReservationEntity> findByUserIdAndIdempotencyKey(UUID userId, UUID idempotencyKey);

    Optional<ReservationEntity> findByIdAndUserId(UUID id, UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from ReservationEntity r where r.id = :id and r.userId = :userId")
    Optional<ReservationEntity> lockForUser(UUID id, UUID userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from ReservationEntity r where r.id = :id")
    Optional<ReservationEntity> lockById(UUID id);

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
