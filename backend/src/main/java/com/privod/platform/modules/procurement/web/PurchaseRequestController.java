package com.privod.platform.modules.procurement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.procurement.domain.PurchaseRequestPriority;
import com.privod.platform.modules.procurement.domain.PurchaseRequestStatus;
import com.privod.platform.modules.procurement.service.ProcurementService;
import com.privod.platform.modules.procurement.web.dto.AssignRequest;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseRequestItemRequest;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseRequestRequest;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestDashboardResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestItemResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestListResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestResponse;
import com.privod.platform.modules.procurement.web.dto.RejectRequest;
import com.privod.platform.modules.procurement.web.dto.UpdatePurchaseRequestItemRequest;
import com.privod.platform.modules.procurement.web.dto.UpdatePurchaseRequestRequest;
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
@RequestMapping("/api/purchase-requests")
@RequiredArgsConstructor
@Tag(name = "Закупки", description = "Управление заявками на закупку")
public class PurchaseRequestController {

    private final ProcurementService procurementService;

    @GetMapping
    @Operation(summary = "Список заявок на закупку с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<PurchaseRequestListResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) PurchaseRequestStatus status,
            @RequestParam(required = false) PurchaseRequestPriority priority,
            @RequestParam(required = false) UUID assignedToId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<PurchaseRequestListResponse> page = procurementService.listRequests(
                projectId, status, priority, assignedToId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить заявку на закупку по ID с позициями")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> getById(@PathVariable UUID id) {
        PurchaseRequestResponse response = procurementService.getRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER', 'FOREMAN')")
    @Operation(summary = "Создать новую заявку на закупку")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> create(
            @Valid @RequestBody CreatePurchaseRequestRequest request) {
        PurchaseRequestResponse response = procurementService.createRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER')")
    @Operation(summary = "Обновить заявку на закупку")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePurchaseRequestRequest request) {
        PurchaseRequestResponse response = procurementService.updateRequest(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER', 'FOREMAN')")
    @Operation(summary = "Добавить позицию в заявку на закупку")
    public ResponseEntity<ApiResponse<PurchaseRequestItemResponse>> addItem(
            @PathVariable UUID id,
            @Valid @RequestBody CreatePurchaseRequestItemRequest request) {
        PurchaseRequestItemResponse response = procurementService.addItem(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER')")
    @Operation(summary = "Обновить позицию заявки на закупку")
    public ResponseEntity<ApiResponse<PurchaseRequestItemResponse>> updateItem(
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdatePurchaseRequestItemRequest request) {
        PurchaseRequestItemResponse response = procurementService.updateItem(itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER')")
    @Operation(summary = "Удалить позицию заявки на закупку")
    public ResponseEntity<ApiResponse<Void>> removeItem(@PathVariable UUID itemId) {
        procurementService.removeItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER', 'FOREMAN')")
    @Operation(summary = "Отправить заявку на закупку")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> submit(@PathVariable UUID id) {
        PurchaseRequestResponse response = procurementService.submitRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Согласовать заявку на закупку")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> approve(@PathVariable UUID id) {
        PurchaseRequestResponse response = procurementService.approveRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Отклонить заявку на закупку")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> reject(
            @PathVariable UUID id,
            @Valid @RequestBody RejectRequest request) {
        PurchaseRequestResponse response = procurementService.rejectRequest(id, request.reason());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Назначить заявку менеджеру по закупкам")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> assign(
            @PathVariable UUID id,
            @Valid @RequestBody AssignRequest request) {
        PurchaseRequestResponse response = procurementService.assignRequest(id, request.assignedToId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/ordered")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER')")
    @Operation(summary = "Отметить заявку как заказанную")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> markOrdered(@PathVariable UUID id) {
        PurchaseRequestResponse response = procurementService.markOrdered(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/delivered")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER')")
    @Operation(summary = "Отметить заявку как доставленную")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> markDelivered(@PathVariable UUID id) {
        PurchaseRequestResponse response = procurementService.markDelivered(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Закрыть заявку на закупку")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> close(@PathVariable UUID id) {
        PurchaseRequestResponse response = procurementService.closeRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Отменить заявку на закупку")
    public ResponseEntity<ApiResponse<PurchaseRequestResponse>> cancel(@PathVariable UUID id) {
        PurchaseRequestResponse response = procurementService.cancelRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/dashboard/summary")
    @Operation(summary = "Получить сводку по заявкам на закупку")
    public ResponseEntity<ApiResponse<PurchaseRequestDashboardResponse>> getDashboard(
            @RequestParam(required = false) UUID projectId) {
        PurchaseRequestDashboardResponse response = procurementService.getDashboardSummary(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
