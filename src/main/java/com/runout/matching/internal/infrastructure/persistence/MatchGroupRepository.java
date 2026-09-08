package com.runout.matching.internal.infrastructure.persistence;

import com.runout.matching.internal.infrastructure.persistence.entity.MatchGroupEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
public interface MatchGroupRepository extends JpaRepository<MatchGroupEntity, UUID> {
}
