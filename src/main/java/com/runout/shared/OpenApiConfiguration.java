package com.runout.shared;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.info.Info;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
        info = @Info(
                title = "Run Out API",
                version = "v1",
                description = "API del monolito modular de Run Out"
        ),
        security = @SecurityRequirement(name = OpenApiConfiguration.BEARER_AUTH)
)
@SecurityScheme(
        name = OpenApiConfiguration.BEARER_AUTH,
        type = SecuritySchemeType.HTTP,
        scheme = "bearer",
        bearerFormat = "JWT",
        description = "Access token JWT emitido por el realm runout de Keycloak"
)
public class OpenApiConfiguration {

    static final String BEARER_AUTH = "bearerAuth";
}
