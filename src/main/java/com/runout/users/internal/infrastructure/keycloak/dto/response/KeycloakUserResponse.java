package com.runout.users.internal.infrastructure.keycloak.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Builder;

import java.util.List;
import java.util.Map;
import java.util.Set;

@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public record KeycloakUserResponse(String id,
                                   String username,
                                   String firstName,
                                   String lastName,
                                   String email,
                                   Boolean emailVerified,
                                   Map<String, List<String>> attributes,
                                   Map<String, Object> userProfileMetadata,
                                   Boolean enabled,
                                   String self,
                                   String origin,
                                   Long createdTimestamp,
                                   Boolean totp,
                                   String federationLink,
                                   String serviceAccountClientId,
                                   List<Map<String, Object>> credentials,
                                   Set<String> disableableCredentialTypes,
                                   List<String> requiredActions,
                                   List<Map<String, Object>> federatedIdentities,
                                   List<String> realmRoles,
                                   Map<String, List<String>> clientRoles,
                                   List<Map<String, Object>> clientConsents,
                                   Integer notBefore,
                                   List<Map<String, Object>> verifiableCredentials,
                                   List<Map<String, Object>> issuedVerifiableCredentials,
                                   Map<String, List<String>> applicationRoles,
                                   List<Map<String, Object>> socialLinks,
                                   Map<String, Boolean> access
) {
}
