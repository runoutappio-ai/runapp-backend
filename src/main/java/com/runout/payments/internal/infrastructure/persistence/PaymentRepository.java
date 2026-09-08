package com.runout.payments.internal.infrastructure.persistence;

import com.runout.payments.internal.infrastructure.persistence.entity.PaymentEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PaymentRepository extends JpaRepository<PaymentEntity, UUID> {
}
