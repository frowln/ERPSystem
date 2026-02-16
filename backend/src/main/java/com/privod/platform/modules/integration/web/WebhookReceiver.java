package com.privod.platform.modules.integration.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.integration.service.IntegrationWebhookService;
import com.privod.platform.modules.integration.web.dto.WebhookIncomingPayload;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/webhooks/receive")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Webhook Receiver", description = "Приём входящих вебхуков")
public class WebhookReceiver {

    private final IntegrationWebhookService webhookService;

    @PostMapping("/{code}")
    @Operation(summary = "Принять входящий вебхук (без аутентификации, проверка по секрету)")
    public ResponseEntity<ApiResponse<Void>> receiveWebhook(
            @PathVariable String code,
            @RequestBody WebhookIncomingPayload payload) {
        log.info("Получен входящий вебхук: code={}, event={}", code, payload.eventType());

        boolean processed = webhookService.processIncomingWebhook(
                code, payload.eventType(), payload.payload(), payload.signature());

        if (processed) {
            return ResponseEntity.ok(ApiResponse.ok());
        } else {
            return ResponseEntity.status(403).body(ApiResponse.error(403, "Вебхук отклонён"));
        }
    }
}
