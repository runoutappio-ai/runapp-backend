package com.runout.experiences.internal.application;

import com.runout.experiences.api.CreateExperienceCommand;
import com.runout.experiences.api.ExperiencePublished;
import com.runout.experiences.api.ExperienceSummary;
import com.runout.experiences.internal.infrastructure.persistence.entity.ExperienceEntity;

import java.time.Instant;
import java.util.UUID;

final class ExperienceMapper {

    private ExperienceMapper() {
    }

    static ExperienceEntity toEntity(CreateExperienceCommand command) {
        return ExperienceEntity.builder()
                .title(command.title())
                .startsAt(command.startsAt())
                .capacity(command.capacity())
                .build();
    }

    static ExperiencePublished toPublishedEvent(UUID experienceId) {
        return ExperiencePublished.builder()
                .experienceId(experienceId)
                .occurredAt(Instant.now())
                .build();
    }

    static ExperienceSummary toSummary(ExperienceEntity experience) {
        return ExperienceSummary.builder()
                .id(experience.getId())
                .title(experience.getTitle())
                .startsAt(experience.getStartsAt())
                .capacity(experience.getCapacity())
                .build();
    }
}
