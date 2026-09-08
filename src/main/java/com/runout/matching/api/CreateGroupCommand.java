package com.runout.matching.api;

import java.util.List;
import java.util.UUID;

public record CreateGroupCommand(UUID experienceId, List<UUID> participantIds) {
    public CreateGroupCommand {
        participantIds = List.copyOf(participantIds);
    }
}
