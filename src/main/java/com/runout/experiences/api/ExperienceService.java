package com.runout.experiences.api;

import java.util.UUID;

public interface ExperienceService {

    ExperienceSummary requirePublished(UUID id);

    UUID create(CreateExperienceCommand command);

    void publish(UUID id);
}
