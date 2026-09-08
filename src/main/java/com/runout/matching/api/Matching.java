package com.runout.matching.api;

import java.util.UUID;

public interface Matching {
    UUID createGroup(CreateGroupCommand command);
}
