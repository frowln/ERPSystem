package com.privod.platform.modules.procurement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.procurement.service.PurchaseOrderService;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseOrderRequest;
import com.privod.platform.modules.procurement.web.dto.PurchaseOrderResponse;
import com.privod.platform.modules.procurement.web.dto.RecordDeliveryRequest;
import com.privod.platform.modules.procurement.web.dto.UpdatePurchaseOrderRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController("procurementPurchaseOrderController")
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
@Tag(name = "Заказы поставщикам", description = "Управление заказами поставщикам")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER')")
    @Operation(summary = "Создать новый заказ поставщику")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> create(
            @Valid @RequestBody CreatePurchaseOrderRequest request) {
        PurchaseOrderResponse response = purchaseOrderService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/from-request/{purchaseRequestId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER')")
    @Operation(summary = "Создать заказ поставщику из согласованной заявки на закупку")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> createFromRequest(
            @PathVariable UUID purchaseRequestId) {
        PurchaseOrderResponse response = purchaseOrderService.createFromPurchaseRequest(purchaseRequestId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER')")
    @Operation(summary = "Обновить заказ поставщику")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePurchaseOrderRequest request) {
        PurchaseOrderResponse response = purchaseOrderService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Согласовать заказ поставщику")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> approve(@PathVariable UUID id) {
        PurchaseOrderResponse response = purchaseOrderService.approve(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER')")
    @Operation(summary = "Отметить заказ как отправленный поставщику")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> markSent(@PathVariable UUID id) {
        PurchaseOrderResponse response = purchaseOrderService.markSent(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/deliver")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER')")
    @Operation(summary = "Зафиксировать доставку позиций заказа")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> recordDelivery(
            @PathVariable UUID id,
            @Valid @RequestBody RecordDeliveryRequest request) {
        PurchaseOrderResponse response = purchaseOrderService.recordDelivery(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Отменить заказ поставщику")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> cancel(@PathVariable UUID id) {
        PurchaseOrderResponse response = purchaseOrderService.cancel(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить заказ поставщику по ID")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> getById(@PathVariable UUID id) {
        PurchaseOrderResponse response = purchaseOrderService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/by-project/{projectId}")
    @Operation(summary = "Получить заказы поставщикам по проекту")
    public ResponseEntity<ApiResponse<List<PurchaseOrderResponse>>> getByProject(@PathVariable UUID projectId) {
        List<PurchaseOrderResponse> response = purchaseOrderService.getByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/by-request/{purchaseRequestId}")
    @Operation(summary = "Получить заказ поставщику по заявке на закупку")
    public ResponseEntity<ApiResponse<PurchaseOrderResponse>> getByPurchaseRequest(
            @PathVariable UUID purchaseRequestId) {
        PurchaseOrderResponse response = purchaseOrderService.getByPurchaseRequest(purchaseRequestId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
