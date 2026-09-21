package com.runout.experiences.api;

import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

@Builder
public record ExperienceSummary(UUID id, String title, Instant startsAt, int capacity) {
}
