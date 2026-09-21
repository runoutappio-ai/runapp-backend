package com.runout.users.internal.infrastructure.keycloak;

import com.runout.users.internal.infrastructure.keycloak.dto.request.KeycloakUserRequest;
import com.runout.users.internal.infrastructure.keycloak.dto.response.KeycloakUserResponse;
import com.runout.users.internal.infrastructure.keycloak.dto.response.KeycloakRoleResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.service.annotation.DeleteExchange;
import org.springframework.web.service.annotation.GetExchange;
import org.springframework.web.service.annotation.HttpExchange;
import org.springframework.web.service.annotation.PostExchange;

import java.util.List;
import java.util.UUID;

@HttpExchange("/admin/realms/runout")
public interface KeycloakAdminHttpClient {

    @GetExchange("/roles/{roleName}")
    KeycloakRoleResponse getRealmRole(@PathVariable String roleName,
                                      @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization);

    @PostExchange("/users")
    ResponseEntity<Void> createUser(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                                    @RequestBody KeycloakUserRequest request);

    @GetExchange("/users/{userId}")
    KeycloakUserResponse getUser(@PathVariable UUID userId,
                                 @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization);

    @GetExchange("/users")
    List<KeycloakUserResponse> getUserByParams(@RequestParam String username,
                                               @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization);

    @DeleteExchange("/users/{userId}")
    void deleteUser(@PathVariable UUID userId,
                    @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization);

    @PostExchange("/users/{userId}/role-mappings/realm")
    void addRealmRole(@PathVariable UUID userId,
                      @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                      @RequestBody List<KeycloakRoleResponse> roles);

    @DeleteExchange("/users/{userId}/role-mappings/realm")
    void removeRealmRole(@PathVariable UUID userId,
                         @RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
                         @RequestBody List<KeycloakRoleResponse> roles);
}
