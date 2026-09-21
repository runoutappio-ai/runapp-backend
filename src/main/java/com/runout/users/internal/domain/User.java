package com.runout.users.internal.domain;

import lombok.Builder;

import java.util.UUID;

@Builder
public record User(UUID id, String displayName, String email) {
}
