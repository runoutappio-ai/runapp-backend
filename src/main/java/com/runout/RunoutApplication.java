package com.runout;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.modulith.Modulithic;

@Modulithic(sharedModules = "shared")
@SpringBootApplication
public class RunoutApplication {
    public static void main(String[] args) {
        SpringApplication.run(RunoutApplication.class, args);
    }
}
