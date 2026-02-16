package com.privod.platform.modules.integration.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.integration.domain.OneCConfig;
import com.privod.platform.modules.integration.domain.SbisConfig;
import com.privod.platform.modules.integration.repository.OneCConfigRepository;
import com.privod.platform.modules.integration.repository.SbisConfigRepository;
import com.privod.platform.modules.integration.repository.ExternalDocumentRepository;
import com.privod.platform.modules.integration.telegram.domain.TelegramConfig;
import com.privod.platform.modules.integration.telegram.repository.TelegramConfigRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/integrations/settings")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Integration Settings", description = "Unified integration settings")
public class IntegrationSettingsController {

    private final OneCConfigRepository oneCConfigRepository;
    private final SbisConfigRepository sbisConfigRepository;
    private final TelegramConfigRepository telegramConfigRepository;
    private final ExternalDocumentRepository externalDocumentRepository;

    public record IntegrationSummary(
            String id,
            String name,
            String description,
            String type,
            boolean enabled,
            boolean configured,
            String status,
            Instant lastSyncAt,
            String configSummary,
            long documentsProcessed
    ) {}

    public record IntegrationSettingsResponse(
            List<IntegrationSummary> integrations,
            int totalConfigured,
            int totalConnected,
            Instant lastGlobalSync
    ) {}

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all integration configurations summary")
    public ResponseEntity<ApiResponse<IntegrationSettingsResponse>> getAllSettings() {
        List<IntegrationSummary> summaries = new ArrayList<>();
        Instant lastGlobalSync = null;

        // 1C Integration
        OneCConfig oneCConfig = oneCConfigRepository.findAll().stream()
                .filter(c -> !c.isDeleted())
                .findFirst().orElse(null);

        summaries.add(new IntegrationSummary(
                "1c",
                "1С:Предприятие",
                "Синхронизация справочников, документов, бухгалтерских проводок и взаиморасчётов.",
                "1c",
                oneCConfig != null && oneCConfig.isActive(),
                oneCConfig != null,
                oneCConfig != null && oneCConfig.isActive() ? "connected" : "disconnected",
                oneCConfig != null ? oneCConfig.getLastSyncAt() : null,
                oneCConfig != null ? maskUrl(oneCConfig.getBaseUrl()) + " / " + oneCConfig.getDatabaseName() : null,
                0
        ));

        if (oneCConfig != null && oneCConfig.getLastSyncAt() != null) {
            lastGlobalSync = oneCConfig.getLastSyncAt();
        }

        // Telegram Integration
        TelegramConfig telegramConfig = telegramConfigRepository.findAll().stream()
                .filter(c -> !c.isDeleted())
                .findFirst().orElse(null);

        summaries.add(new IntegrationSummary(
                "telegram",
                "Telegram Bot",
                "Push-уведомления в Telegram, отправка отчётов и оповещений о задачах.",
                "telegram",
                telegramConfig != null && telegramConfig.isEnabled(),
                telegramConfig != null,
                telegramConfig != null && telegramConfig.isEnabled() ? "connected" : "disconnected",
                null,
                telegramConfig != null ? "@" + telegramConfig.getBotUsername() : null,
                0
        ));

        // SBIS Integration
        SbisConfig sbisConfig = sbisConfigRepository.findAll().stream()
                .filter(c -> !c.isDeleted())
                .findFirst().orElse(null);

        summaries.add(new IntegrationSummary(
                "sbis",
                "СБИС",
                "Документооборот через СБИС: отправка, приём и подписание первичных документов.",
                "sbis",
                sbisConfig != null && sbisConfig.isActive(),
                sbisConfig != null,
                sbisConfig != null && sbisConfig.isActive() ? "connected" : "disconnected",
                null,
                sbisConfig != null ? "ИНН: " + sbisConfig.getOrganizationInn() : null,
                0
        ));

        // EDO Integration
        long edoDocCount = externalDocumentRepository.countByDeletedFalse();
        boolean edoConfigured = edoDocCount > 0;

        summaries.add(new IntegrationSummary(
                "edo",
                "ЭДО (Диадок / Контур)",
                "Электронный документооборот: отправка и получение документов через ЭДО.",
                "edo",
                edoConfigured,
                edoConfigured,
                edoConfigured ? "connected" : "disconnected",
                null,
                edoConfigured ? "Документов: " + edoDocCount : null,
                edoDocCount
        ));

        int totalConfigured = (int) summaries.stream().filter(IntegrationSummary::configured).count();
        int totalConnected = (int) summaries.stream().filter(s -> "connected".equals(s.status())).count();

        return ResponseEntity.ok(ApiResponse.ok(new IntegrationSettingsResponse(
                summaries, totalConfigured, totalConnected, lastGlobalSync)));
    }

    private String maskUrl(String url) {
        if (url == null) return null;
        // Show only the hostname
        try {
            java.net.URI uri = java.net.URI.create(url);
            return uri.getScheme() + "://" + uri.getHost() + (uri.getPort() > 0 ? ":" + uri.getPort() : "");
        } catch (Exception e) {
            return "****";
        }
    }
}
