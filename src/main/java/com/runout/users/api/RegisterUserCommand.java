package com.runout.users.api;

import lombok.Builder;

@Builder
public record RegisterUserCommand(String displayName, String email, String password) {
}
