package com.runout.experiences.internal.application;

import com.runout.experiences.api.CreateExperienceCommand;
import com.runout.experiences.api.ExperienceService;
import com.runout.experiences.api.ExperienceSummary;
import com.runout.experiences.internal.domain.ExperienceStatus;
import com.runout.experiences.internal.infrastructure.persistence.ExperienceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
class ExperienceApplicationService implements ExperienceService {

    private final ExperienceRepository repository;
    private final ApplicationEventPublisher events;

    @Override
    public UUID create(CreateExperienceCommand command) {
        return repository.save(ExperienceMapper.toEntity(command)).getId();
    }

    @Override
    public void publish(UUID id) {
        var experience = repository.findById(id).orElseThrow();
        experience.publish();
        events.publishEvent(ExperienceMapper.toPublishedEvent(id));
    }

    @Override
    @Transactional(readOnly = true)
    public ExperienceSummary requirePublished(UUID id) {
        var experience = repository.findById(id)
                .filter(it -> it.getStatus() == ExperienceStatus.PUBLISHED)
                .orElseThrow();

        return ExperienceMapper.toSummary(experience);
    }
}
