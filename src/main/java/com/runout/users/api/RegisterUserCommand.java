package com.runout.users.api;

public record RegisterUserCommand(String displayName, String email, String password) {
}
