package com.runout.experiences.api;

import java.time.Instant;

public record CreateExperienceCommand(String title, Instant startsAt, int capacity) {
}
