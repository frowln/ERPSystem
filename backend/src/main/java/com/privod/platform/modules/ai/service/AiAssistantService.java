package com.privod.platform.modules.ai.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.modules.ai.config.AiProperties;
import com.privod.platform.modules.ai.domain.AiConversation;
import com.privod.platform.modules.ai.domain.AiMessage;
import com.privod.platform.modules.ai.domain.AiUsageLog;
import com.privod.platform.modules.ai.domain.ConversationStatus;
import com.privod.platform.modules.ai.domain.MessageRole;
import com.privod.platform.modules.ai.repository.AiConversationRepository;
import com.privod.platform.modules.ai.repository.AiMessageRepository;
import com.privod.platform.modules.ai.repository.AiUsageLogRepository;
import com.privod.platform.modules.ai.web.dto.AiChatRequest;
import com.privod.platform.modules.ai.web.dto.AiChatResponse;
import com.privod.platform.modules.ai.web.dto.AiStatusResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiAssistantService {

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
    private static final int MAX_CONVERSATION_MESSAGES = 50;

    private final AiProperties aiProperties;
    @Qualifier("aiRestTemplate")
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiUsageLogRepository usageLogRepository;
    private final AiContextService contextService;

    private final ExecutorService sseExecutor = Executors.newCachedThreadPool();

    /**
     * Check whether the AI assistant is configured and available.
     */
    public AiStatusResponse getStatus() {
        if (!aiProperties.isConfigured()) {
            return new AiStatusResponse(
                    false,
                    aiProperties.getProvider(),
                    aiProperties.getModel(),
                    "AI ассистент не настроен. Добавьте AI_API_KEY в переменные окружения."
            );
        }
        return new AiStatusResponse(
                true,
                aiProperties.getProvider(),
                aiProperties.getModel(),
                "AI ассистент готов к работе."
        );
    }

    /**
     * Send a message to the AI assistant and get a response.
     * Creates or reuses a conversation, persists messages to DB,
     * and calls the OpenAI API.
     */
    @Transactional
    public AiChatResponse chat(AiChatRequest request, UUID userId) {
        if (!aiProperties.isConfigured()) {
            return new AiChatResponse(
                    "AI ассистент не настроен. Добавьте AI_API_KEY в переменные окружения.",
                    null, 0, null
            );
        }

        // Resolve or create conversation
        AiConversation conversation = resolveConversation(request.conversationId(), userId, request.message());

        // Save user message
        AiMessage userMessage = AiMessage.builder()
                .conversationId(conversation.getId())
                .role(MessageRole.USER)
                .content(request.message())
                .tokensUsed(0)
                .build();
        messageRepository.save(userMessage);

        // Build context from the platform data
        String dataContext = contextService.buildContext(request.message(), userId);

        // Build message history for the API call
        List<Map<String, String>> apiMessages = buildApiMessages(conversation.getId(), dataContext);

        // Call OpenAI API
        try {
            Map<String, Object> apiResponse = callOpenAiApi(apiMessages);
            String reply = extractReply(apiResponse);
            int tokensUsed = extractTotalTokens(apiResponse);

            // Save assistant response
            AiMessage assistantMessage = AiMessage.builder()
                    .conversationId(conversation.getId())
                    .role(MessageRole.ASSISTANT)
                    .content(reply)
                    .tokensUsed(tokensUsed)
                    .model(aiProperties.getModel())
                    .build();
            messageRepository.save(assistantMessage);

            // Update conversation last message timestamp
            conversation.setLastMessageAt(Instant.now());
            conversationRepository.save(conversation);

            // Trim conversation if too many messages
            trimConversation(conversation.getId());

            // Log usage
            logUsage(userId, tokensUsed, apiResponse);

            log.info("AI chat completed: conversationId={}, tokensUsed={}, model={}",
                    conversation.getId(), tokensUsed, aiProperties.getModel());

            return new AiChatResponse(reply, conversation.getId(), tokensUsed, aiProperties.getModel());

        } catch (RestClientException e) {
            log.error("OpenAI API call failed: {}", e.getMessage(), e);
            String errorReply = "Произошла ошибка при обращении к AI сервису. Пожалуйста, попробуйте позже.";

            AiMessage errorMessage = AiMessage.builder()
                    .conversationId(conversation.getId())
                    .role(MessageRole.ASSISTANT)
                    .content(errorReply)
                    .tokensUsed(0)
                    .model(aiProperties.getModel())
                    .build();
            messageRepository.save(errorMessage);

            return new AiChatResponse(errorReply, conversation.getId(), 0, aiProperties.getModel());
        }
    }

    /**
     * Stream a response from the AI assistant using Server-Sent Events (SSE).
     */
    public SseEmitter chatStream(AiChatRequest request, UUID userId) {
        SseEmitter emitter = new SseEmitter(120_000L); // 2 minute timeout

        if (!aiProperties.isConfigured()) {
            sseExecutor.execute(() -> {
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("AI ассистент не настроен. Добавьте AI_API_KEY в переменные окружения."));
                    emitter.complete();
                } catch (IOException e) {
                    emitter.completeWithError(e);
                }
            });
            return emitter;
        }

        sseExecutor.execute(() -> {
            try {
                // Resolve or create conversation
                AiConversation conversation = resolveConversation(request.conversationId(), userId, request.message());

                // Save user message
                AiMessage userMessage = AiMessage.builder()
                        .conversationId(conversation.getId())
                        .role(MessageRole.USER)
                        .content(request.message())
                        .tokensUsed(0)
                        .build();
                messageRepository.save(userMessage);

                // Build context from the platform data
                String dataContext = contextService.buildContext(request.message(), userId);

                // Build message history
                List<Map<String, String>> apiMessages = buildApiMessages(conversation.getId(), dataContext);

                // Send conversation ID event
                emitter.send(SseEmitter.event()
                        .name("conversation")
                        .data(Map.of("conversationId", conversation.getId().toString())));

                // Stream from OpenAI
                StringBuilder fullResponse = new StringBuilder();
                streamOpenAiApi(apiMessages, emitter, fullResponse);

                // Save the complete assistant message
                AiMessage assistantMessage = AiMessage.builder()
                        .conversationId(conversation.getId())
                        .role(MessageRole.ASSISTANT)
                        .content(fullResponse.toString())
                        .tokensUsed(0) // token count not available in streaming
                        .model(aiProperties.getModel())
                        .build();
                messageRepository.save(assistantMessage);

                // Update conversation
                conversation.setLastMessageAt(Instant.now());
                conversationRepository.save(conversation);

                trimConversation(conversation.getId());
                logUsage(userId, fullResponse.length() / 4, null);

                emitter.send(SseEmitter.event().name("done").data("[DONE]"));
                emitter.complete();

            } catch (Exception e) {
                log.error("SSE streaming failed: {}", e.getMessage(), e);
                try {
                    emitter.send(SseEmitter.event()
                            .name("error")
                            .data("Ошибка при генерации ответа: " + e.getMessage()));
                } catch (IOException ex) {
                    // ignore
                }
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private AiConversation resolveConversation(UUID conversationId, UUID userId, String firstMessage) {
        if (conversationId != null) {
            return conversationRepository.findByIdAndDeletedFalse(conversationId)
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Диалог не найден: " + conversationId));
        }

        // Create a new conversation with auto-generated title
        String title = firstMessage.length() > 100
                ? firstMessage.substring(0, 97) + "..."
                : firstMessage;

        AiConversation conversation = AiConversation.builder()
                .userId(userId)
                .title(title)
                .status(ConversationStatus.ACTIVE)
                .lastMessageAt(Instant.now())
                .build();

        conversation = conversationRepository.save(conversation);
        log.info("New AI conversation created: id={}, userId={}", conversation.getId(), userId);
        return conversation;
    }

    private List<Map<String, String>> buildApiMessages(UUID conversationId, String dataContext) {
        List<Map<String, String>> messages = new ArrayList<>();

        // System prompt
        String systemPrompt = aiProperties.getSystemPrompt();
        if (dataContext != null && !dataContext.isBlank()) {
            systemPrompt += "\n\n--- КОНТЕКСТ ИЗ БАЗЫ ДАННЫХ ---\n" + dataContext + "\n--- КОНЕЦ КОНТЕКСТА ---";
        }

        messages.add(Map.of("role", "system", "content", systemPrompt));

        // Load conversation history
        List<AiMessage> history = messageRepository
                .findByConversationIdAndDeletedFalseOrderByCreatedAtAsc(conversationId);

        for (AiMessage msg : history) {
            String role = switch (msg.getRole()) {
                case USER -> "user";
                case ASSISTANT -> "assistant";
                case SYSTEM -> "system";
            };
            messages.add(Map.of("role", role, "content", msg.getContent()));
        }

        return messages;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callOpenAiApi(List<Map<String, String>> messages) {
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

    @SuppressWarnings("unchecked")
    private int extractTotalTokens(Map<String, Object> apiResponse) {
        try {
            Map<String, Object> usage = (Map<String, Object>) apiResponse.get("usage");
            if (usage != null) {
                Object total = usage.get("total_tokens");
                if (total instanceof Number) {
                    return ((Number) total).intValue();
                }
            }
        } catch (Exception e) {
            log.warn("Failed to extract token count from OpenAI response", e);
        }
        return 0;
    }

    private void streamOpenAiApi(List<Map<String, String>> messages,
                                  SseEmitter emitter,
                                  StringBuilder fullResponse) throws IOException {
        HttpURLConnection connection = null;
        try {
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", aiProperties.getModel());
            requestBody.put("messages", messages);
            requestBody.put("max_tokens", aiProperties.getMaxTokens());
            requestBody.put("temperature", aiProperties.getTemperature());
            requestBody.put("stream", true);

            String jsonBody = objectMapper.writeValueAsString(requestBody);

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
                                String chunk = delta.asText();
                                fullResponse.append(chunk);
                                emitter.send(SseEmitter.event()
                                        .name("message")
                                        .data(chunk));
                            }
                        } catch (JsonProcessingException e) {
                            log.debug("Skipping unparseable SSE chunk: {}", data);
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

    private void trimConversation(UUID conversationId) {
        long messageCount = messageRepository.countByConversationIdAndDeletedFalse(conversationId);
        if (messageCount > MAX_CONVERSATION_MESSAGES) {
            List<AiMessage> allMessages = messageRepository
                    .findByConversationIdAndDeletedFalseOrderByCreatedAtAsc(conversationId);

            int toRemove = allMessages.size() - MAX_CONVERSATION_MESSAGES;
            for (int i = 0; i < toRemove; i++) {
                allMessages.get(i).softDelete();
                messageRepository.save(allMessages.get(i));
            }
            log.debug("Trimmed {} old messages from conversation {}", toRemove, conversationId);
        }
    }

    private void logUsage(UUID userId, int totalTokens, Map<String, Object> apiResponse) {
        int inputTokens = 0;
        int outputTokens = 0;

        if (apiResponse != null) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> usage = (Map<String, Object>) apiResponse.get("usage");
                if (usage != null) {
                    inputTokens = usage.get("prompt_tokens") instanceof Number
                            ? ((Number) usage.get("prompt_tokens")).intValue() : 0;
                    outputTokens = usage.get("completion_tokens") instanceof Number
                            ? ((Number) usage.get("completion_tokens")).intValue() : 0;
                }
            } catch (Exception e) {
                log.debug("Could not parse token usage from API response", e);
            }
        }

        if (inputTokens == 0 && outputTokens == 0) {
            inputTokens = totalTokens / 2;
            outputTokens = totalTokens - inputTokens;
        }

        // Approximate cost (gpt-4o-mini pricing: $0.15/1M input, $0.60/1M output)
        double cost = (inputTokens * 0.00000015) + (outputTokens * 0.0000006);

        AiUsageLog usageLog = AiUsageLog.builder()
                .userId(userId)
                .feature("AI_CHAT")
                .tokensInput(inputTokens)
                .tokensOutput(outputTokens)
                .cost(cost)
                .build();
        usageLogRepository.save(usageLog);
    }
}
