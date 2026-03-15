package com.privod.platform.modules.integration.slack.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.integration.slack.domain.SlackConfig;
import com.privod.platform.modules.integration.slack.repository.SlackConfigRepository;
import com.privod.platform.modules.integration.slack.service.SlackNotificationService;
import com.privod.platform.modules.integration.slack.web.dto.SlackConfigResponse;
import com.privod.platform.modules.integration.slack.web.dto.UpdateSlackConfigRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/slack")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Slack Integration", description = "Управление интеграцией со Slack")
public class SlackController {

    private final SlackConfigRepository configRepository;

    @Autowired(required = false)
    private SlackNotificationService notificationService;

    // -----------------------------------------------------------------------
    // GET /api/integrations/slack/config
    // -----------------------------------------------------------------------

    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить конфигурацию Slack")
    public ResponseEntity<ApiResponse<SlackConfigResponse>> getConfig() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        SlackConfig config = configRepository.findByOrganizationIdAndDeletedFalse(orgId)
                .orElseGet(() -> {
                    // Return an empty / default config if none exists yet
                    SlackConfig newConfig = SlackConfig.builder()
                            .organizationId(orgId)
                            .enabled(false)
                            .build();
                    return configRepository.save(newConfig);
                });
        return ResponseEntity.ok(ApiResponse.ok(SlackConfigResponse.fromEntity(config)));
    }

    // -----------------------------------------------------------------------
    // PUT /api/integrations/slack/config
    // -----------------------------------------------------------------------

    @PutMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить конфигурацию Slack")
    public ResponseEntity<ApiResponse<SlackConfigResponse>> updateConfig(
            @Valid @RequestBody UpdateSlackConfigRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        SlackConfig config = configRepository.findByOrganizationIdAndDeletedFalse(orgId)
                .orElseGet(() -> {
                    SlackConfig newConfig = SlackConfig.builder()
                            .organizationId(orgId)
                            .enabled(false)
                            .build();
                    return configRepository.save(newConfig);
                });

        if (request.getWorkspaceName() != null) {
            config.setWorkspaceName(request.getWorkspaceName());
        }
        if (request.getWebhookUrl() != null) {
            config.setWebhookUrl(request.getWebhookUrl());
        }
        if (request.getBotToken() != null) {
            config.setBotToken(request.getBotToken());
        }
        if (request.getChannelId() != null) {
            config.setChannelId(request.getChannelId());
        }
        if (request.getEnabled() != null) {
            config.setEnabled(request.getEnabled());
        }

        config = configRepository.save(config);
        log.info("Slack config updated for organization {}", orgId);
        return ResponseEntity.ok(ApiResponse.ok(SlackConfigResponse.fromEntity(config)));
    }

    // -----------------------------------------------------------------------
    // POST /api/integrations/slack/test
    // -----------------------------------------------------------------------

    @PostMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Отправить тестовое сообщение в Slack")
    public ResponseEntity<ApiResponse<Map<String, Object>>> testConnection() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        SlackConfig config = configRepository.findByOrganizationIdAndDeletedFalse(orgId)
                .orElse(null);

        if (config == null || config.getWebhookUrl() == null || config.getWebhookUrl().isBlank()) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error(400, "Webhook URL не настроен. Сначала сохраните конфигурацию."));
        }

        if (notificationService == null) {
            return ResponseEntity.ok(ApiResponse.ok(Map.of(
                    "success", false,
                    "message", "Slack-интеграция отключена в настройках сервера (integrations.slack.enabled=false)"
            )));
        }

        boolean success = notificationService.sendTestMessage(config.getWebhookUrl());
        return ResponseEntity.ok(ApiResponse.ok(Map.of(
                "success", success,
                "message", success
                        ? "Тестовое сообщение отправлено"
                        : "Не удалось отправить сообщение. Проверьте Webhook URL."
        )));
    }
}
