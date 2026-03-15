package com.privod.platform.modules.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "app.ai")
@Getter
@Setter
public class AiProperties {

    /**
     * AI provider: "openai" or "anthropic"
     */
    private String provider = "openai";

    /**
     * API key for the AI provider. Set via AI_API_KEY environment variable.
     */
    private String apiKey = "";

    /**
     * Model to use (e.g., gpt-4o-mini, gpt-4o, claude-3-5-sonnet)
     */
    private String model = "gpt-4o-mini";

    /**
     * Maximum tokens in the AI response
     */
    private int maxTokens = 4096;

    /**
     * Temperature for response generation (0.0 - 2.0)
     */
    private double temperature = 0.7;

    /**
     * System prompt that defines the AI assistant's behavior
     */
    private String systemPrompt = "";

    /**
     * GigaChat (Sber) provider configuration.
     * Data stays within Russian Federation (152-FZ compliant).
     */
    private GigaChatProperties gigachat = new GigaChatProperties();

    /**
     * Check if AI is properly configured with an API key
     */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    @Getter
    @Setter
    public static class GigaChatProperties {
        /** OAuth2 client ID from Sber Developer Portal */
        private String clientId = "";

        /** OAuth2 client secret from Sber Developer Portal */
        private String clientSecret = "";

        /** GigaChat model name */
        private String model = "GigaChat";

        /** OAuth2 scope (e.g. GIGACHAT_API_PERS, GIGACHAT_API_CORP) */
        private String scope = "GIGACHAT_API_PERS";
    }
}
