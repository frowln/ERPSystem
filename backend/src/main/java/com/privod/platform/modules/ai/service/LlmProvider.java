package com.privod.platform.modules.ai.service;

import java.util.List;
import java.util.Map;

/**
 * Abstraction for LLM provider API calls.
 * Allows switching between GigaChat (Sber), OpenAI, Yandex GPT, etc.
 * Default provider for production: GigaChat (data stays in Russia per 152-FZ).
 */
public interface LlmProvider {

    /**
     * Send a chat completion request to the LLM.
     *
     * @param systemPrompt the system prompt defining assistant behavior
     * @param userMessage  the user's message
     * @return the assistant's reply text
     */
    String chat(String systemPrompt, String userMessage);

    /**
     * Send a chat completion request with full message history.
     *
     * @param messages list of message maps with "role" and "content" keys
     * @return a response map containing choices, usage, etc. (provider-specific format normalized to OpenAI-compatible)
     */
    Map<String, Object> chatWithHistory(List<Map<String, String>> messages);

    /**
     * Stream a chat completion. Writes SSE chunks to the provided callback.
     *
     * @param messages      list of message maps
     * @param chunkConsumer callback for each content chunk
     */
    void chatStream(List<Map<String, String>> messages, ChunkConsumer chunkConsumer) throws Exception;

    /**
     * @return human-readable provider name (e.g. "GigaChat", "OpenAI")
     */
    String getProviderName();

    /**
     * @return true if this provider is properly configured and ready to use
     */
    boolean isConfigured();

    /**
     * Functional interface for streaming chunk consumption.
     */
    @FunctionalInterface
    interface ChunkConsumer {
        void accept(String chunk) throws Exception;
    }
}
