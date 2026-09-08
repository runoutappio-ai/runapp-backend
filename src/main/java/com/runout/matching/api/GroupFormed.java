package com.runout.matching.api;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record GroupFormed(UUID groupId, UUID experienceId, List<UUID> participantIds, Instant occurredAt) {
    public GroupFormed {
        participantIds = List.copyOf(participantIds);
    }
}
