package com.privod.platform;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PrivodPlatformApplication {

    public static void main(String[] args) {
        SpringApplication.run(PrivodPlatformApplication.class, args);
    }
}
