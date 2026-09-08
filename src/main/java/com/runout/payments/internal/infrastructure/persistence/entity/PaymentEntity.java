package com.runout.payments.internal.infrastructure.persistence.entity;

import com.runout.payments.internal.domain.PaymentStatus;
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
@Table(name = "payment")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PaymentEntity {

    @Id
    private UUID id;
    private UUID bookingId;

    @Enumerated(EnumType.STRING)
    private PaymentStatus status;

    private Instant createdAt;

    public PaymentEntity(UUID bookingId) {
        this.id = UUID.randomUUID();
        this.bookingId = bookingId;
        this.status = PaymentStatus.PENDING;
        this.createdAt = Instant.now();
    }

    public void capture() {
        status = PaymentStatus.CAPTURED;
    }
}
