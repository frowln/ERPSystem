package com.privod.platform.modules.integration.telegram.service;

import com.privod.platform.modules.integration.telegram.domain.TelegramConfig;
import com.privod.platform.modules.integration.telegram.domain.TelegramMessage;
import com.privod.platform.modules.integration.telegram.domain.TelegramMessageStatus;
import com.privod.platform.modules.integration.telegram.domain.TelegramMessageType;
import com.privod.platform.modules.integration.telegram.domain.TelegramSubscription;
import com.privod.platform.modules.integration.telegram.repository.TelegramConfigRepository;
import com.privod.platform.modules.integration.telegram.repository.TelegramMessageRepository;
import com.privod.platform.modules.integration.telegram.repository.TelegramSubscriptionRepository;
import com.privod.platform.modules.integration.telegram.web.dto.TelegramMessageResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TelegramBotService {

    private static final String TELEGRAM_API_URL = "https://api.telegram.org/bot%s/sendMessage";
    private static final int MAX_MESSAGE_LENGTH = 4096;

    private final TelegramConfigRepository configRepository;
    private final TelegramSubscriptionRepository subscriptionRepository;
    private final TelegramMessageRepository messageRepository;
    private final RestTemplate restTemplate;

    /**
     * Send a message to a specific Telegram chat.
     */
    @Transactional
    public TelegramMessageResponse sendMessage(String chatId, String text) {
        TelegramConfig config = getActiveConfig();

        String truncatedText = text.length() > MAX_MESSAGE_LENGTH
                ? text.substring(0, MAX_MESSAGE_LENGTH - 3) + "..."
                : text;

        TelegramMessage message = TelegramMessage.builder()
                .chatId(chatId)
                .messageText(truncatedText)
                .messageType(TelegramMessageType.NOTIFICATION)
                .status(TelegramMessageStatus.PENDING)
                .build();
        message = messageRepository.save(message);

        try {
            callTelegramApi(config.getBotToken(), chatId, truncatedText);
            message.markSent();
            message = messageRepository.save(message);
            log.info("Сообщение Telegram отправлено в чат {}: {}", chatId, message.getId());
        } catch (Exception e) {
            message.markFailed(e.getMessage());
            message = messageRepository.save(message);
            log.error("Ошибка отправки сообщения Telegram в чат {}: {}", chatId, e.getMessage());
            throw new RestClientException("Не удалось отправить сообщение в Telegram: " + e.getMessage(), e);
        }

        return TelegramMessageResponse.fromEntity(message);
    }

    /**
     * Send a notification to a user by looking up their Telegram chat ID.
     */
    @Transactional
    public TelegramMessageResponse sendNotification(UUID userId, String title, String body) {
        TelegramSubscription subscription = subscriptionRepository
                .findByUserIdAndActiveAndDeletedFalse(userId, true)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Активная подписка Telegram не найдена для пользователя: " + userId));

        String formattedMessage = formatNotification(title, body);

        TelegramMessage message = TelegramMessage.builder()
                .chatId(subscription.getChatId())
                .messageText(formattedMessage)
                .messageType(TelegramMessageType.NOTIFICATION)
                .status(TelegramMessageStatus.PENDING)
                .build();
        message = messageRepository.save(message);

        try {
            TelegramConfig config = getActiveConfig();
            callTelegramApi(config.getBotToken(), subscription.getChatId(), formattedMessage);
            message.markSent();
            message = messageRepository.save(message);
            log.info("Уведомление отправлено пользователю {} в чат {}", userId, subscription.getChatId());
        } catch (Exception e) {
            message.markFailed(e.getMessage());
            message = messageRepository.save(message);
            log.error("Ошибка отправки уведомления пользователю {}: {}", userId, e.getMessage());
        }

        return TelegramMessageResponse.fromEntity(message);
    }

    /**
     * Broadcast a message to all subscribers of a project.
     */
    @Transactional
    public List<TelegramMessageResponse> broadcastToProject(UUID projectId, String messageText,
                                                             List<UUID> projectMemberUserIds) {
        List<TelegramSubscription> subscribers = subscriptionRepository
                .findActiveProjectSubscribers(projectMemberUserIds);

        if (subscribers.isEmpty()) {
            log.info("Нет активных подписчиков Telegram для проекта {}", projectId);
            return List.of();
        }

        String formattedMessage = "\uD83D\uDCC1 *Проект*\n\n" + messageText;

        return subscribers.stream()
                .map(sub -> sendMessageInternal(
                        sub.getChatId(), formattedMessage,
                        TelegramMessageType.NOTIFICATION, "Project", projectId))
                .toList();
    }

    /**
     * Send an urgent safety alert to all safety subscribers.
     */
    @Transactional
    public List<TelegramMessageResponse> sendSafetyAlert(UUID incidentId, String messageText) {
        List<TelegramSubscription> subscribers = subscriptionRepository.findActiveSafetySubscribers();

        if (subscribers.isEmpty()) {
            log.warn("Нет активных подписчиков на оповещения безопасности");
            return List.of();
        }

        String formattedMessage = "\u26A0\uFE0F *ОПОВЕЩЕНИЕ БЕЗОПАСНОСТИ*\n\n" + messageText;

        return subscribers.stream()
                .map(sub -> sendMessageInternal(
                        sub.getChatId(), formattedMessage,
                        TelegramMessageType.ALERT, "SafetyIncident", incidentId))
                .toList();
    }

    /**
     * Process an incoming command from a Telegram chat.
     */
    @Transactional
    public TelegramMessageResponse processCommand(String chatId, String command) {
        String responseText;

        switch (command.toLowerCase().trim()) {
            case "/status" -> responseText = handleStatusCommand();
            case "/tasks" -> responseText = handleTasksCommand(chatId);
            case "/help" -> responseText = handleHelpCommand();
            default -> {
                if (command.startsWith("/")) {
                    responseText = "Неизвестная команда. Используйте /help для списка доступных команд.";
                } else {
                    responseText = "Отправьте команду, начинающуюся с /. Используйте /help для помощи.";
                }
            }
        }

        return sendMessageInternal(chatId, responseText, TelegramMessageType.COMMAND_RESPONSE, null, null);
    }

    /**
     * Retry sending all pending messages.
     */
    @Transactional
    public int retryPendingMessages() {
        List<TelegramMessage> pendingMessages = messageRepository
                .findByStatusAndDeletedFalseOrderByCreatedAtAsc(TelegramMessageStatus.PENDING);

        if (pendingMessages.isEmpty()) {
            return 0;
        }

        TelegramConfig config = getActiveConfig();
        int successCount = 0;

        for (TelegramMessage message : pendingMessages) {
            try {
                callTelegramApi(config.getBotToken(), message.getChatId(), message.getMessageText());
                message.markSent();
                messageRepository.save(message);
                successCount++;
            } catch (Exception e) {
                message.markFailed(e.getMessage());
                messageRepository.save(message);
                log.error("Повторная отправка не удалась для сообщения {}: {}", message.getId(), e.getMessage());
            }
        }

        log.info("Повторная отправка: {}/{} сообщений отправлено успешно", successCount, pendingMessages.size());
        return successCount;
    }

    // --- Internal helpers ---

    private TelegramMessageResponse sendMessageInternal(String chatId, String text,
                                                         TelegramMessageType type,
                                                         String relatedEntityType, UUID relatedEntityId) {
        String truncatedText = text.length() > MAX_MESSAGE_LENGTH
                ? text.substring(0, MAX_MESSAGE_LENGTH - 3) + "..."
                : text;

        TelegramMessage message = TelegramMessage.builder()
                .chatId(chatId)
                .messageText(truncatedText)
                .messageType(type)
                .status(TelegramMessageStatus.PENDING)
                .relatedEntityType(relatedEntityType)
                .relatedEntityId(relatedEntityId)
                .build();
        message = messageRepository.save(message);

        try {
            TelegramConfig config = getActiveConfig();
            callTelegramApi(config.getBotToken(), chatId, truncatedText);
            message.markSent();
            message = messageRepository.save(message);
        } catch (Exception e) {
            message.markFailed(e.getMessage());
            message = messageRepository.save(message);
            log.error("Ошибка отправки сообщения в чат {}: {}", chatId, e.getMessage());
        }

        return TelegramMessageResponse.fromEntity(message);
    }

    private void callTelegramApi(String botToken, String chatId, String text) {
        String url = String.format(TELEGRAM_API_URL, botToken);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("chat_id", chatId);
        body.put("text", text);
        body.put("parse_mode", "Markdown");

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, request, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RestClientException("Telegram API вернул статус: " + response.getStatusCode());
        }

        log.debug("Telegram API ответ: {}", response.getBody());
    }

    private TelegramConfig getActiveConfig() {
        // For now, get any enabled config. In multi-org setup, filter by org context.
        return configRepository.findAll().stream()
                .filter(c -> !c.isDeleted() && c.isEnabled())
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Активная конфигурация Telegram бота не найдена. Настройте интеграцию."));
    }

    private String formatNotification(String title, String body) {
        return "\uD83D\uDD14 *" + escapeMarkdown(title) + "*\n\n" + escapeMarkdown(body);
    }

    private String escapeMarkdown(String text) {
        if (text == null) return "";
        return text
                .replace("_", "\\_")
                .replace("*", "\\*")
                .replace("[", "\\[")
                .replace("`", "\\`");
    }

    private String handleStatusCommand() {
        long pendingCount = messageRepository.countByStatusAndDeletedFalse(TelegramMessageStatus.PENDING);
        long failedCount = messageRepository.countByStatusAndDeletedFalse(TelegramMessageStatus.FAILED);
        long activeSubscribers = subscriptionRepository.findByActiveAndDeletedFalse(true).size();

        return "\uD83D\uDCCA *Статус системы Привод*\n\n" +
                "\u2705 Бот активен\n" +
                "\uD83D\uDC65 Подписчиков: " + activeSubscribers + "\n" +
                "\u23F3 В очереди: " + pendingCount + "\n" +
                "\u274C Ошибок: " + failedCount;
    }

    private String handleTasksCommand(String chatId) {
        return subscriptionRepository.findByChatIdAndDeletedFalse(chatId)
                .map(sub -> "\uD83D\uDCCB *Ваши подписки*\n\n" +
                        "Проекты: " + (sub.isNotifyProjects() ? "\u2705" : "\u274C") + "\n" +
                        "Безопасность: " + (sub.isNotifySafety() ? "\u2705" : "\u274C") + "\n" +
                        "Задачи: " + (sub.isNotifyTasks() ? "\u2705" : "\u274C") + "\n" +
                        "Согласования: " + (sub.isNotifyApprovals() ? "\u2705" : "\u274C"))
                .orElse("Вы ещё не подписаны на уведомления. Свяжитесь с администратором.");
    }

    private String handleHelpCommand() {
        return "\uD83E\uDD16 *Привод Телеграм Бот*\n\n" +
                "Доступные команды:\n" +
                "/status - Статус системы\n" +
                "/tasks - Ваши подписки на уведомления\n" +
                "/help - Справка по командам\n\n" +
                "Бот автоматически отправляет уведомления о проектах, задачах, безопасности и согласованиях.";
    }
}
