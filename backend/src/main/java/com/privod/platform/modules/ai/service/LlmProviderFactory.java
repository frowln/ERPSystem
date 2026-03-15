package com.privod.platform.modules.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.modules.ai.config.AiProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

/**
 * Factory that creates the appropriate LLM provider based on configuration.
 * Default: GigaChat (Sber) for 152-FZ compliance (data stays in Russia).
 * Override: set AI_PROVIDER=openai for development/testing.
 */
@Configuration
@Slf4j
public class LlmProviderFactory {

    @Bean
    public LlmProvider llmProvider(AiProperties aiProperties,
                                   @Qualifier("aiRestTemplate") RestTemplate restTemplate,
                                   ObjectMapper objectMapper) {
        String provider = aiProperties.getProvider();
        log.info("Initializing LLM provider: '{}'", provider);

        return switch (provider.toLowerCase()) {
            case "gigachat" -> {
                log.info("Using GigaChat provider (152-FZ compliant, data stays in Russia)");
                yield new GigaChatProvider(aiProperties, restTemplate, objectMapper);
            }
            case "openai" -> {
                log.warn("Using OpenAI provider. WARNING: Data is sent to US servers. "
                        + "NOT recommended for production with personal data (152-FZ violation). "
                        + "Set AI_PROVIDER=gigachat for production.");
                yield new OpenAiProvider(aiProperties, restTemplate, objectMapper);
            }
            default -> {
                log.warn("Unknown AI provider '{}', falling back to GigaChat (152-FZ compliant)", provider);
                yield new GigaChatProvider(aiProperties, restTemplate, objectMapper);
            }
        };
    }
}
