package com.privod.platform.modules.integration.telegram.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.integration.telegram.domain.TelegramConfig;
import com.privod.platform.modules.integration.telegram.domain.TelegramLinkCode;
import com.privod.platform.modules.integration.telegram.domain.TelegramMessageStatus;
import com.privod.platform.modules.integration.telegram.domain.TelegramSubscription;
import com.privod.platform.modules.integration.telegram.repository.TelegramConfigRepository;
import com.privod.platform.modules.integration.telegram.repository.TelegramLinkCodeRepository;
import com.privod.platform.modules.integration.telegram.repository.TelegramMessageRepository;
import com.privod.platform.modules.integration.telegram.repository.TelegramSubscriptionRepository;
import com.privod.platform.modules.integration.telegram.service.TelegramBotService;
import com.privod.platform.modules.integration.telegram.service.TelegramWebhookService;
import com.privod.platform.modules.integration.telegram.web.dto.CreateTelegramSubscriptionRequest;
import com.privod.platform.modules.integration.telegram.web.dto.TelegramConfigResponse;
import com.privod.platform.modules.integration.telegram.web.dto.TelegramMessageResponse;
import com.privod.platform.modules.integration.telegram.web.dto.TelegramSubscriptionResponse;
import com.privod.platform.modules.integration.telegram.web.dto.TelegramUpdate;
import com.privod.platform.modules.integration.telegram.web.dto.TestMessageRequest;
import com.privod.platform.modules.integration.telegram.web.dto.UpdateTelegramConfigRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/integrations/telegram")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Telegram Integration", description = "Управление интеграцией с Telegram ботом")
public class TelegramController {

    private final TelegramBotService botService;
    private final TelegramWebhookService webhookService;
    private final TelegramConfigRepository configRepository;
    private final TelegramSubscriptionRepository subscriptionRepository;
    private final TelegramMessageRepository messageRepository;
    private final TelegramLinkCodeRepository linkCodeRepository;

    // --- Configuration endpoints ---

    @GetMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить конфигурацию Telegram бота")
    public ResponseEntity<ApiResponse<TelegramConfigResponse>> getConfig(
            @RequestParam(required = false) UUID organizationId) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (organizationId != null && !organizationId.equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot access Telegram config for another organization");
        }
        TelegramConfig config = configRepository
                .findByOrganizationIdAndDeletedFalse(currentOrgId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Конфигурация Telegram не найдена для организации: " + currentOrgId));
        return ResponseEntity.ok(ApiResponse.ok(TelegramConfigResponse.fromEntity(config)));
    }

    @PutMapping("/config")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить конфигурацию Telegram бота")
    public ResponseEntity<ApiResponse<TelegramConfigResponse>> updateConfig(
            @Valid @RequestBody UpdateTelegramConfigRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot update Telegram config for another organization");
        }

        TelegramConfig config = configRepository
                .findByOrganizationIdAndDeletedFalse(currentOrgId)
                .orElse(null);

        if (config == null) {
            config = TelegramConfig.builder()
                    .botToken(request.botToken())
                    .botUsername(request.botUsername())
                    .webhookUrl(request.webhookUrl())
                    .enabled(request.enabled() != null ? request.enabled() : false)
                    .chatIds(request.chatIds())
                    .organizationId(currentOrgId)
                    .build();
        } else {
            config.setBotToken(request.botToken());
            config.setBotUsername(request.botUsername());
            if (request.webhookUrl() != null) {
                config.setWebhookUrl(request.webhookUrl());
            }
            if (request.enabled() != null) {
                config.setEnabled(request.enabled());
            }
            if (request.chatIds() != null) {
                config.setChatIds(request.chatIds());
            }
        }

        config = configRepository.save(config);
        log.info("Конфигурация Telegram обновлена для организации {}", currentOrgId);
        return ResponseEntity.ok(ApiResponse.ok(TelegramConfigResponse.fromEntity(config)));
    }

    // --- Webhook endpoint ---

    @PostMapping("/webhook")
    @Operation(summary = "Webhook для приёма сообщений от Telegram")
    public ResponseEntity<Void> webhook(@RequestBody TelegramUpdate update) {
        try {
            webhookService.processUpdate(update);
        } catch (Exception e) {
            log.error("Ошибка обработки webhook от Telegram: {}", e.getMessage(), e);
        }
        // Always return 200 to Telegram to avoid retries
        return ResponseEntity.ok().build();
    }

    // --- Subscription endpoints ---

    @GetMapping("/subscriptions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Список подписок на уведомления Telegram")
    public ResponseEntity<ApiResponse<PageResponse<TelegramSubscriptionResponse>>> listSubscriptions(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TelegramSubscriptionResponse> page = subscriptionRepository.findByDeletedFalse(pageable)
                .map(TelegramSubscriptionResponse::fromEntity);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/subscriptions")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Создать подписку на уведомления Telegram")
    public ResponseEntity<ApiResponse<TelegramSubscriptionResponse>> createSubscription(
            @Valid @RequestBody CreateTelegramSubscriptionRequest request) {
        if (subscriptionRepository.existsByUserIdAndChatIdAndDeletedFalse(request.userId(), request.chatId())) {
            throw new IllegalArgumentException(
                    "Подписка для пользователя " + request.userId() + " с чатом " + request.chatId() + " уже существует");
        }

        TelegramSubscription subscription = TelegramSubscription.builder()
                .userId(request.userId())
                .chatId(request.chatId())
                .notifyProjects(request.notifyProjects() != null ? request.notifyProjects() : true)
                .notifySafety(request.notifySafety() != null ? request.notifySafety() : true)
                .notifyTasks(request.notifyTasks() != null ? request.notifyTasks() : true)
                .notifyApprovals(request.notifyApprovals() != null ? request.notifyApprovals() : true)
                .active(true)
                .build();

        subscription = subscriptionRepository.save(subscription);
        log.info("Подписка Telegram создана: пользователь {}, чат {}", request.userId(), request.chatId());

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(TelegramSubscriptionResponse.fromEntity(subscription)));
    }

    @DeleteMapping("/subscriptions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Удалить подписку на уведомления Telegram")
    public ResponseEntity<ApiResponse<Void>> deleteSubscription(@PathVariable UUID id) {
        TelegramSubscription subscription = subscriptionRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Подписка Telegram не найдена: " + id));

        subscription.softDelete();
        subscriptionRepository.save(subscription);
        log.info("Подписка Telegram удалена: {}", id);

        return ResponseEntity.ok(ApiResponse.ok());
    }

    // --- Test & Messages endpoints ---

    @PostMapping("/test")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Отправить тестовое сообщение в Telegram")
    public ResponseEntity<ApiResponse<TelegramMessageResponse>> sendTestMessage(
            @Valid @RequestBody TestMessageRequest request) {
        TelegramMessageResponse response = botService.sendMessage(request.chatId(), request.message());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // --- Link code & Status endpoints ---

    @PostMapping("/generate-link")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Сгенерировать код для привязки аккаунта Telegram")
    public ResponseEntity<ApiResponse<LinkCodeResponse>> generateLinkCode(@RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot generate link code for another user");
        }
        UUID targetUserId = currentUserId;

        // Invalidate old codes for this user
        linkCodeRepository.findByUserIdAndUsedFalseAndDeletedFalse(targetUserId)
                .ifPresent(old -> {
                    old.softDelete();
                    linkCodeRepository.save(old);
                });

        String code = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

        TelegramLinkCode linkCode = TelegramLinkCode.builder()
                .code(code)
                .userId(targetUserId)
                .expiresAt(java.time.Instant.now().plus(java.time.Duration.ofMinutes(30)))
                .build();

        linkCode = linkCodeRepository.save(linkCode);

        // Build the deep link URL for Telegram
        TelegramConfig config = configRepository.findByOrganizationIdAndDeletedFalse(currentOrgId)
                .filter(c -> !c.isDeleted() && c.isEnabled())
                .orElse(null);

        String botUsername = config != null ? config.getBotUsername() : "privod_erp_bot";
        String deepLink = "https://t.me/" + botUsername + "?start=" + code;

        log.info("Код привязки Telegram сгенерирован для пользователя {}: {}", targetUserId, code);

        return ResponseEntity.ok(ApiResponse.ok(new LinkCodeResponse(code, deepLink, linkCode.getExpiresAt())));
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Получить статус интеграции Telegram")
    public ResponseEntity<ApiResponse<TelegramStatusResponse>> getStatus() {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        TelegramConfig config = configRepository.findByOrganizationIdAndDeletedFalse(currentOrgId)
                .filter(c -> !c.isDeleted())
                .orElse(null);

        long subscriberCount = subscriptionRepository.findByActiveAndDeletedFalse(true).size();
        long pendingMessages = messageRepository.countByStatusAndDeletedFalse(TelegramMessageStatus.PENDING);
        long failedMessages = messageRepository.countByStatusAndDeletedFalse(TelegramMessageStatus.FAILED);

        return ResponseEntity.ok(ApiResponse.ok(new TelegramStatusResponse(
                config != null && config.isEnabled(),
                config != null,
                config != null ? config.getBotUsername() : null,
                subscriberCount,
                pendingMessages,
                failedMessages
        )));
    }

    public record LinkCodeResponse(
            String code,
            String deepLink,
            java.time.Instant expiresAt
    ) {}

    public record TelegramStatusResponse(
            boolean enabled,
            boolean configured,
            String botUsername,
            long subscriberCount,
            long pendingMessages,
            long failedMessages
    ) {}

    @GetMapping("/messages")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @Operation(summary = "Журнал отправленных сообщений Telegram")
    public ResponseEntity<ApiResponse<PageResponse<TelegramMessageResponse>>> listMessages(
            @RequestParam(required = false) TelegramMessageStatus status,
            @RequestParam(required = false) String chatId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<TelegramMessageResponse> page;

        if (status != null) {
            page = messageRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(TelegramMessageResponse::fromEntity);
        } else if (chatId != null) {
            page = messageRepository.findByChatIdAndDeletedFalse(chatId, pageable)
                    .map(TelegramMessageResponse::fromEntity);
        } else {
            page = messageRepository.findByDeletedFalse(pageable)
                    .map(TelegramMessageResponse::fromEntity);
        }

        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
