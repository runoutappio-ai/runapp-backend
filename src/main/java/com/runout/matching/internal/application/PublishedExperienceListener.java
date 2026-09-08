package com.runout.matching.internal.application;

import com.runout.experiences.api.ExperiencePublished;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.modulith.events.ApplicationModuleListener;
import org.springframework.stereotype.Component;
@Component @RequiredArgsConstructor
class PublishedExperienceListener {
    private static final Logger log=LoggerFactory.getLogger(PublishedExperienceListener.class);
    @ApplicationModuleListener void on(ExperiencePublished event) { log.info("Experience {} is available for matching", event.experienceId()); }
}
