package com.privod.platform.modules.apiManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.apiManagement.domain.WebhookDeliveryStatus;
import com.privod.platform.modules.apiManagement.service.WebhookDeliveryService;
import com.privod.platform.modules.apiManagement.web.dto.WebhookDeliveryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/api-management/webhook-deliveries")
@RequiredArgsConstructor
@Tag(name = "Webhook Deliveries", description = "Webhook delivery tracking endpoints")
public class WebhookDeliveryController {

    private final WebhookDeliveryService deliveryService;

    @GetMapping("/by-webhook/{webhookId}")
    @Operation(summary = "Get deliveries for a webhook")
    public ResponseEntity<ApiResponse<PageResponse<WebhookDeliveryResponse>>> getDeliveries(
            @PathVariable UUID webhookId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WebhookDeliveryResponse> page = deliveryService.getDeliveries(webhookId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/by-status")
    @Operation(summary = "Get deliveries by status")
    public ResponseEntity<ApiResponse<PageResponse<WebhookDeliveryResponse>>> getDeliveriesByStatus(
            @RequestParam WebhookDeliveryStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<WebhookDeliveryResponse> page = deliveryService.getDeliveriesByStatus(status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/{deliveryId}/retry")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Manually retry a failed delivery")
    public ResponseEntity<ApiResponse<WebhookDeliveryResponse>> retryDelivery(@PathVariable UUID deliveryId) {
        WebhookDeliveryResponse response = deliveryService.markFailed(deliveryId, "Manual retry requested");
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
