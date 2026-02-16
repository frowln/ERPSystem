package com.privod.platform.modules.integration.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.integration.service.IntegrationWebhookService;
import com.privod.platform.modules.integration.web.dto.CreateWebhookEndpointRequest;
import com.privod.platform.modules.integration.web.dto.UpdateWebhookEndpointRequest;
import com.privod.platform.modules.integration.web.dto.WebhookDeliveryResponse;
import com.privod.platform.modules.integration.web.dto.WebhookEndpointResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
@RequestMapping("/api/admin/webhooks")
@RequiredArgsConstructor
@Tag(name = "Webhooks", description = "Управление вебхуками")
public class WebhookController {

    private final IntegrationWebhookService webhookService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Список всех вебхуков")
    public ResponseEntity<ApiResponse<PageResponse<WebhookEndpointResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WebhookEndpointResponse> page = webhookService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить вебхук по ID")
    public ResponseEntity<ApiResponse<WebhookEndpointResponse>> getById(@PathVariable UUID id) {
        WebhookEndpointResponse response = webhookService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Зарегистрировать вебхук")
    public ResponseEntity<ApiResponse<WebhookEndpointResponse>> register(
            @Valid @RequestBody CreateWebhookEndpointRequest request) {
        WebhookEndpointResponse response = webhookService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить вебхук")
    public ResponseEntity<ApiResponse<WebhookEndpointResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWebhookEndpointRequest request) {
        WebhookEndpointResponse response = webhookService.updateWebhook(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить вебхук")
    public ResponseEntity<ApiResponse<Void>> unregister(@PathVariable UUID id) {
        webhookService.unregister(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/deliveries")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Лог доставок вебхуков")
    public ResponseEntity<ApiResponse<PageResponse<WebhookDeliveryResponse>>> deliveries(
            @RequestParam(required = false) UUID webhookId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WebhookDeliveryResponse> page = webhookService.getDeliveryLog(webhookId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/deliveries/{deliveryId}/retry")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Повторить доставку вебхука")
    public ResponseEntity<ApiResponse<WebhookDeliveryResponse>> retryDelivery(@PathVariable UUID deliveryId) {
        WebhookDeliveryResponse response = webhookService.retryDelivery(deliveryId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
