package com.runout;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

class ModularityTests {
    @Test
    void modulesRespectTheirBoundaries() {
        ApplicationModules.of(RunoutApplication.class).verify();
    }
}
