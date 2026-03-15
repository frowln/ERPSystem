package com.privod.platform.modules.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.modules.ai.config.AiProperties;
// import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * OpenAI LLM provider.
 * WARNING: Sends data to US servers. NOT suitable for production with personal data
 * under Russian Federal Law 152-FZ (data localization requirement).
 * Use GigaChat or Yandex GPT for production deployments in Russia.
 */
@Slf4j
public class OpenAiProvider implements LlmProvider {

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    private final AiProperties aiProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    public OpenAiProvider(AiProperties aiProperties,
                          @Qualifier("aiRestTemplate") RestTemplate restTemplate,
                          ObjectMapper objectMapper) {
        this.aiProperties = aiProperties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        log.warn("OpenAI LLM provider initialized. WARNING: Data is sent to US servers. "
                + "This provider is NOT compliant with 152-FZ for personal data processing. "
                + "Use 'gigachat' provider for production. Set AI_PROVIDER=gigachat in environment.");
    }

    @Override
    // @CircuitBreaker(name = "ai")
    public String chat(String systemPrompt, String userMessage) {
        List<Map<String, String>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userMessage)
        );
        Map<String, Object> response = chatWithHistory(messages);
        return extractReply(response);
    }

    @Override
    @SuppressWarnings("unchecked")
    public Map<String, Object> chatWithHistory(List<Map<String, String>> messages) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(aiProperties.getApiKey());

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", aiProperties.getModel());
        requestBody.put("messages", messages);
        requestBody.put("max_tokens", aiProperties.getMaxTokens());
        requestBody.put("temperature", aiProperties.getTemperature());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                OPENAI_API_URL, HttpMethod.POST, entity, Map.class);

        if (response.getBody() == null) {
            throw new RestClientException("Empty response from OpenAI API");
        }

        return response.getBody();
    }

    @Override
    public void chatStream(List<Map<String, String>> messages, ChunkConsumer chunkConsumer) throws Exception {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", aiProperties.getModel());
        requestBody.put("messages", messages);
        requestBody.put("max_tokens", aiProperties.getMaxTokens());
        requestBody.put("temperature", aiProperties.getTemperature());
        requestBody.put("stream", true);

        String jsonBody = objectMapper.writeValueAsString(requestBody);

        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) URI.create(OPENAI_API_URL).toURL().openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + aiProperties.getApiKey());
            connection.setDoOutput(true);
            connection.setConnectTimeout(30_000);
            connection.setReadTimeout(120_000);

            connection.getOutputStream().write(jsonBody.getBytes());
            connection.getOutputStream().flush();

            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(connection.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.startsWith("data: ")) {
                        String data = line.substring(6).trim();
                        if ("[DONE]".equals(data)) {
                            break;
                        }
                        try {
                            JsonNode node = objectMapper.readTree(data);
                            JsonNode delta = node.path("choices").path(0).path("delta").path("content");
                            if (!delta.isMissingNode() && !delta.isNull()) {
                                chunkConsumer.accept(delta.asText());
                            }
                        } catch (JsonProcessingException e) {
                            log.debug("Skipping unparseable OpenAI SSE chunk: {}", data);
                        }
                    }
                }
            }
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    @Override
    public String getProviderName() {
        return "OpenAI";
    }

    @Override
    public boolean isConfigured() {
        return aiProperties.getApiKey() != null && !aiProperties.getApiKey().isBlank();
    }

    @SuppressWarnings("unchecked")
    private String extractReply(Map<String, Object> apiResponse) {
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) apiResponse.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        } catch (Exception e) {
            log.warn("Failed to extract reply from OpenAI response", e);
        }
        return "Не удалось получить ответ от AI.";
    }
}
