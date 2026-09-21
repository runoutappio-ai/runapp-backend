package com.runout.users.internal.infrastructure.keycloak.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record KeycloakRoleResponse(String id, String name) {
}
