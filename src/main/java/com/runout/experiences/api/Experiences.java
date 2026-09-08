package com.runout.experiences.api;

import java.util.UUID;

public interface Experiences {

    ExperienceSummary requirePublished(UUID id);

    UUID create(CreateExperienceCommand command);

    void publish(UUID id);
}
