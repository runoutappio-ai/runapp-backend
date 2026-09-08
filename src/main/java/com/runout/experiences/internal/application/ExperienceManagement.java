package com.runout.experiences.internal.application;

import com.runout.experiences.api.CreateExperienceCommand;
import com.runout.experiences.api.ExperiencePublished;
import com.runout.experiences.api.ExperienceSummary;
import com.runout.experiences.api.Experiences;
import com.runout.experiences.internal.domain.ExperienceStatus;
import com.runout.experiences.internal.infrastructure.persistence.ExperienceRepository;
import com.runout.experiences.internal.infrastructure.persistence.entity.ExperienceEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
class ExperienceManagement implements Experiences {

    private final ExperienceRepository repository;
    private final ApplicationEventPublisher events;

    public UUID create(CreateExperienceCommand command) {
        return repository.save(new ExperienceEntity(command.title(), command.startsAt(), command.capacity())).getId();
    }

    public void publish(UUID id) {
        var value = repository.findById(id).orElseThrow();
        value.publish();
        events.publishEvent(new ExperiencePublished(id, Instant.now()));
    }

    @Transactional(readOnly = true)
    public ExperienceSummary requirePublished(UUID id) {
        var e = repository.findById(id)
                .filter(it -> it.getStatus() == ExperienceStatus.PUBLISHED)
                .orElseThrow();
        return new ExperienceSummary(e.getId(), e.getTitle(), e.getStartsAt(), e.getCapacity());
    }
}
