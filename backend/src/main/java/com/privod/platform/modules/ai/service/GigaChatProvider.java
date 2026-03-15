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
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.locks.ReentrantLock;

/**
 * GigaChat (Sber) LLM provider.
 * Data processing stays within Russian Federation (152-FZ compliant).
 *
 * Auth flow: OAuth2 client_credentials -> access_token (valid ~30 min)
 * API: https://gigachat.devices.sberbank.ru/api/v1/chat/completions
 */
@Slf4j
public class GigaChatProvider implements LlmProvider {

    private static final String OAUTH_URL = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth";
    private static final String API_BASE_URL = "https://gigachat.devices.sberbank.ru/api/v1";
    private static final String CHAT_COMPLETIONS_URL = API_BASE_URL + "/chat/completions";

    /** Safety margin: refresh token 2 minutes before actual expiry */
    private static final long TOKEN_EXPIRY_MARGIN_MS = 120_000;

    private final AiProperties aiProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    // Token cache
    private volatile String cachedAccessToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;
    private final ReentrantLock tokenLock = new ReentrantLock();

    public GigaChatProvider(AiProperties aiProperties,
                            @Qualifier("aiRestTemplate") RestTemplate restTemplate,
                            ObjectMapper objectMapper) {
        this.aiProperties = aiProperties;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
        log.info("GigaChat LLM provider initialized (152-FZ compliant, data stays in Russia). Model: {}, Scope: {}",
                aiProperties.getGigachat().getModel(), aiProperties.getGigachat().getScope());
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
        String accessToken = getAccessToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(accessToken);

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", aiProperties.getGigachat().getModel());
        requestBody.put("messages", messages);
        requestBody.put("max_tokens", aiProperties.getMaxTokens());
        requestBody.put("temperature", aiProperties.getTemperature());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                CHAT_COMPLETIONS_URL, HttpMethod.POST, entity, Map.class);

        if (response.getBody() == null) {
            throw new RestClientException("Empty response from GigaChat API");
        }

        return response.getBody();
    }

    @Override
    public void chatStream(List<Map<String, String>> messages, ChunkConsumer chunkConsumer) throws Exception {
        String accessToken = getAccessToken();

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", aiProperties.getGigachat().getModel());
        requestBody.put("messages", messages);
        requestBody.put("max_tokens", aiProperties.getMaxTokens());
        requestBody.put("temperature", aiProperties.getTemperature());
        requestBody.put("stream", true);

        String jsonBody = objectMapper.writeValueAsString(requestBody);

        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection) URI.create(CHAT_COMPLETIONS_URL).toURL().openConnection();
            connection.setRequestMethod("POST");
            connection.setRequestProperty("Content-Type", "application/json");
            connection.setRequestProperty("Authorization", "Bearer " + accessToken);
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
                            log.debug("Skipping unparseable GigaChat SSE chunk: {}", data);
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
        return "GigaChat";
    }

    @Override
    public boolean isConfigured() {
        AiProperties.GigaChatProperties gc = aiProperties.getGigachat();
        return gc != null
                && gc.getClientId() != null && !gc.getClientId().isBlank()
                && gc.getClientSecret() != null && !gc.getClientSecret().isBlank();
    }

    // ========================================================================
    // OAuth2 token management
    // ========================================================================

    /**
     * Get a valid access token, refreshing if expired or about to expire.
     * Thread-safe with lock to prevent concurrent token refresh.
     */
    private String getAccessToken() {
        if (cachedAccessToken != null && Instant.now().isBefore(tokenExpiresAt)) {
            return cachedAccessToken;
        }

        tokenLock.lock();
        try {
            // Double-check after acquiring lock
            if (cachedAccessToken != null && Instant.now().isBefore(tokenExpiresAt)) {
                return cachedAccessToken;
            }
            return refreshAccessToken();
        } finally {
            tokenLock.unlock();
        }
    }

    @SuppressWarnings("unchecked")
    private String refreshAccessToken() {
        AiProperties.GigaChatProperties gc = aiProperties.getGigachat();

        if (gc.getClientId() == null || gc.getClientId().isBlank()
                || gc.getClientSecret() == null || gc.getClientSecret().isBlank()) {
            throw new RestClientException("GigaChat credentials not configured. Set GIGACHAT_CLIENT_ID and GIGACHAT_CLIENT_SECRET.");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
        // GigaChat OAuth uses Basic auth with client_id:client_secret
        headers.setBasicAuth(gc.getClientId(), gc.getClientSecret());
        // Required: unique request ID
        headers.set("RqUID", UUID.randomUUID().toString());

        String body = "scope=" + gc.getScope();
        HttpEntity<String> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    OAUTH_URL, HttpMethod.POST, entity, Map.class);

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null || !responseBody.containsKey("access_token")) {
                throw new RestClientException("GigaChat OAuth response missing access_token");
            }

            cachedAccessToken = (String) responseBody.get("access_token");

            // GigaChat tokens typically expire in ~30 minutes (1800 seconds)
            // The response contains "expires_at" as a Unix timestamp in milliseconds
            if (responseBody.containsKey("expires_at")) {
                long expiresAtMs = ((Number) responseBody.get("expires_at")).longValue();
                tokenExpiresAt = Instant.ofEpochMilli(expiresAtMs).minusMillis(TOKEN_EXPIRY_MARGIN_MS);
            } else {
                // Fallback: assume 25 min lifetime
                tokenExpiresAt = Instant.now().plusSeconds(1500);
            }

            log.info("GigaChat access token refreshed, expires at {}", tokenExpiresAt);
            return cachedAccessToken;

        } catch (RestClientException e) {
            log.error("Failed to obtain GigaChat access token: {}", e.getMessage());
            throw new RestClientException("GigaChat authentication failed: " + e.getMessage(), e);
        }
    }

    // ========================================================================
    // Response parsing (GigaChat uses OpenAI-compatible format)
    // ========================================================================

    @SuppressWarnings("unchecked")
    private String extractReply(Map<String, Object> apiResponse) {
        try {
            List<Map<String, Object>> choices = (List<Map<String, Object>>) apiResponse.get("choices");
            if (choices != null && !choices.isEmpty()) {
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        } catch (Exception e) {
            log.warn("Failed to extract reply from GigaChat response", e);
        }
        return "Не удалось получить ответ от GigaChat.";
    }
}
