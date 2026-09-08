package com.runout.experiences.api;

import java.time.Instant;
import java.util.UUID;

public record ExperienceSummary(UUID id, String title, Instant startsAt, int capacity) {
}
