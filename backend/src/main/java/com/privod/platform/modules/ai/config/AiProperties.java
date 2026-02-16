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
     * Check if AI is properly configured with an API key
     */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
