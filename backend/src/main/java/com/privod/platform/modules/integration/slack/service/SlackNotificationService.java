package com.privod.platform.modules.integration.slack.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Sends notifications to Slack via incoming webhooks.
 * Only active when integrations.slack.enabled=true in application properties.
 */
@Service
@ConditionalOnProperty(name = "integrations.slack.enabled", havingValue = "true", matchIfMissing = false)
@RequiredArgsConstructor
@Slf4j
public class SlackNotificationService {

    private final RestTemplate restTemplate;

    /**
     * Send a plain-text message to a Slack channel via webhook URL.
     */
    public void sendMessage(String webhookUrl, String text) {
        try {
            Map<String, String> payload = Map.of("text", text);
            restTemplate.postForEntity(webhookUrl, payload, String.class);
            log.info("Slack message sent successfully");
        } catch (Exception e) {
            log.error("Failed to send Slack message: {}", e.getMessage());
        }
    }

    /**
     * Send a safety alert with a prominent prefix.
     */
    public void sendSafetyAlert(String webhookUrl, String message) {
        sendMessage(webhookUrl, "\u26a0\ufe0f *\u041e\u041f\u041e\u0412\u0415\u0429\u0415\u041d\u0418\u0415 \u041e\u0422* | " + message);
    }

    /**
     * Send a task-related notification.
     */
    public void sendTaskNotification(String webhookUrl, String message) {
        sendMessage(webhookUrl, "\ud83d\udccb " + message);
    }

    /**
     * Send a test message to verify webhook connectivity.
     */
    public boolean sendTestMessage(String webhookUrl) {
        try {
            Map<String, String> payload = Map.of("text",
                    "\u2705 \u0422\u0435\u0441\u0442\u043e\u0432\u043e\u0435 \u0441\u043e\u043e\u0431\u0449\u0435\u043d\u0438\u0435 \u043e\u0442 PRIVOD \u043f\u043b\u0430\u0442\u0444\u043e\u0440\u043c\u044b. \u0418\u043d\u0442\u0435\u0433\u0440\u0430\u0446\u0438\u044f \u0440\u0430\u0431\u043e\u0442\u0430\u0435\u0442!");
            restTemplate.postForEntity(webhookUrl, payload, String.class);
            log.info("Slack test message sent successfully");
            return true;
        } catch (Exception e) {
            log.error("Slack test message failed: {}", e.getMessage());
            return false;
        }
    }
}
