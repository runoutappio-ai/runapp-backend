package com.runout;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;
import org.springframework.modulith.docs.Documenter;

class DocumentationTests {
    @Test
    void writeModuleDocumentation() {
        new Documenter(ApplicationModules.of(RunoutApplication.class)).writeDocumentation();
    }
}
