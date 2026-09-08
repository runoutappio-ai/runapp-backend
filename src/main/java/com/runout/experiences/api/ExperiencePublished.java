package com.runout.experiences.api;

import java.time.Instant;
import java.util.UUID;

public record ExperiencePublished(UUID experienceId, Instant occurredAt) {
}
