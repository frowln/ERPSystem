package com.privod.platform.modules.ai.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Configuration
public class AiConfig {

    @Bean(name = "aiRestTemplate")
    public RestTemplate aiRestTemplate() {
        return new RestTemplate();
    }
}
