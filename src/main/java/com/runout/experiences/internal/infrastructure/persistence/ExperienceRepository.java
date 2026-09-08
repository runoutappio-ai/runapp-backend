package com.runout.experiences.internal.infrastructure.persistence;

import com.runout.experiences.internal.infrastructure.persistence.entity.ExperienceEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;
public interface ExperienceRepository extends JpaRepository<ExperienceEntity, UUID> {
}
