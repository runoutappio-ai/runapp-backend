package com.runout.experiences.api;

import lombok.Builder;

import java.time.Instant;

@Builder
public record CreateExperienceCommand(String title, Instant startsAt, int capacity) {
}
