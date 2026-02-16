package com.privod.platform.modules.procurementExt.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.procurementExt.domain.DeliveryStatus;
import com.privod.platform.modules.procurementExt.service.ProcurementExtService;
import com.privod.platform.modules.procurementExt.web.dto.CreateDeliveryItemRequest;
import com.privod.platform.modules.procurementExt.web.dto.CreateDeliveryRequest;
import com.privod.platform.modules.procurementExt.web.dto.DeliveryItemResponse;
import com.privod.platform.modules.procurementExt.web.dto.DeliveryResponse;
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
@RequestMapping("/api/deliveries")
@RequiredArgsConstructor
@Tag(name = "Доставки", description = "Управление доставками")
public class DeliveryController {

    private final ProcurementExtService procurementExtService;

    @GetMapping
    @Operation(summary = "Список доставок с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<DeliveryResponse>>> list(
            @RequestParam(required = false) DeliveryStatus status,
            @RequestParam(required = false) UUID routeId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<DeliveryResponse> page = procurementExtService.listDeliveries(status, routeId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить доставку по ID")
    public ResponseEntity<ApiResponse<DeliveryResponse>> getById(@PathVariable UUID id) {
        DeliveryResponse response = procurementExtService.getDelivery(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Создать доставку")
    public ResponseEntity<ApiResponse<DeliveryResponse>> create(
            @Valid @RequestBody CreateDeliveryRequest request) {
        DeliveryResponse response = procurementExtService.createDelivery(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Обновить доставку")
    public ResponseEntity<ApiResponse<DeliveryResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDeliveryRequest request) {
        DeliveryResponse response = procurementExtService.updateDelivery(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER')")
    @Operation(summary = "Удалить доставку (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        procurementExtService.deleteDelivery(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Добавить позицию в доставку")
    public ResponseEntity<ApiResponse<DeliveryItemResponse>> addItem(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDeliveryItemRequest request) {
        DeliveryItemResponse response = procurementExtService.addDeliveryItem(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/loading")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Начать загрузку доставки")
    public ResponseEntity<ApiResponse<DeliveryResponse>> startLoading(@PathVariable UUID id) {
        DeliveryResponse response = procurementExtService.transitionDeliveryStatus(id, DeliveryStatus.LOADING);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/depart")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Отправить доставку")
    public ResponseEntity<ApiResponse<DeliveryResponse>> depart(@PathVariable UUID id) {
        DeliveryResponse response = procurementExtService.transitionDeliveryStatus(id, DeliveryStatus.IN_TRANSIT);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/deliver")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Отметить доставку как доставленную")
    public ResponseEntity<ApiResponse<DeliveryResponse>> deliver(@PathVariable UUID id) {
        DeliveryResponse response = procurementExtService.transitionDeliveryStatus(id, DeliveryStatus.DELIVERED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER')")
    @Operation(summary = "Отменить доставку")
    public ResponseEntity<ApiResponse<DeliveryResponse>> cancel(@PathVariable UUID id) {
        DeliveryResponse response = procurementExtService.transitionDeliveryStatus(id, DeliveryStatus.CANCELLED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
