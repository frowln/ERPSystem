package com.privod.platform.modules.procurementExt.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.ops.domain.DispatchStatus;
import com.privod.platform.modules.procurementExt.service.ProcurementExtService;
import com.privod.platform.modules.procurementExt.web.dto.CreateDispatchOrderRequest;
import com.privod.platform.modules.procurementExt.web.dto.CreateSupplierRatingRequest;
import com.privod.platform.modules.procurementExt.web.dto.DispatchOrderResponse;
import com.privod.platform.modules.procurementExt.web.dto.SupplierRatingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/procurement-ext")
@RequiredArgsConstructor
@Tag(name = "Расширенные закупки", description = "Диспетчеризация и оценка поставщиков")
public class DispatchController {

    private final ProcurementExtService procurementExtService;

    // ========================================================================
    // Dispatch Orders
    // ========================================================================

    @GetMapping("/dispatch-orders/{id}")
    @Operation(summary = "Получить заявку на диспетчеризацию по ID")
    public ResponseEntity<ApiResponse<DispatchOrderResponse>> getDispatchOrder(@PathVariable UUID id) {
        DispatchOrderResponse response = procurementExtService.getDispatchOrder(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/dispatch-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER')")
    @Operation(summary = "Создать заявку на диспетчеризацию")
    public ResponseEntity<ApiResponse<DispatchOrderResponse>> createDispatchOrder(
            @Valid @RequestBody CreateDispatchOrderRequest request) {
        DispatchOrderResponse response = procurementExtService.createDispatchOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/dispatch-orders/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER')")
    @Operation(summary = "Обновить заявку на диспетчеризацию")
    public ResponseEntity<ApiResponse<DispatchOrderResponse>> updateDispatchOrder(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDispatchOrderRequest request) {
        DispatchOrderResponse response = procurementExtService.updateDispatchOrder(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/dispatch-orders/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER')")
    @Operation(summary = "Удалить заявку на диспетчеризацию (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> deleteDispatchOrder(@PathVariable UUID id) {
        procurementExtService.deleteDispatchOrder(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/dispatch-orders/{id}/dispatch")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Отправить заявку на диспетчеризацию")
    public ResponseEntity<ApiResponse<DispatchOrderResponse>> dispatch(@PathVariable UUID id) {
        DispatchOrderResponse response = procurementExtService.transitionDispatchStatus(id, DispatchStatus.DISPATCHED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/dispatch-orders/{id}/in-transit")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Отметить заявку как 'В пути'")
    public ResponseEntity<ApiResponse<DispatchOrderResponse>> markInTransit(@PathVariable UUID id) {
        DispatchOrderResponse response = procurementExtService.transitionDispatchStatus(id, DispatchStatus.IN_TRANSIT);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/dispatch-orders/{id}/deliver")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Отметить заявку как доставленную")
    public ResponseEntity<ApiResponse<DispatchOrderResponse>> deliverDispatch(@PathVariable UUID id) {
        DispatchOrderResponse response = procurementExtService.transitionDispatchStatus(id, DispatchStatus.DELIVERED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/dispatch-orders/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER')")
    @Operation(summary = "Отменить заявку на диспетчеризацию")
    public ResponseEntity<ApiResponse<DispatchOrderResponse>> cancelDispatch(@PathVariable UUID id) {
        DispatchOrderResponse response = procurementExtService.transitionDispatchStatus(id, DispatchStatus.CANCELLED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ========================================================================
    // Supplier Ratings
    // ========================================================================

    @GetMapping("/supplier-ratings/{supplierId}")
    @Operation(summary = "Получить оценки поставщика")
    public ResponseEntity<ApiResponse<List<SupplierRatingResponse>>> getSupplierRatings(
            @PathVariable UUID supplierId) {
        List<SupplierRatingResponse> ratings = procurementExtService.getRatingsForSupplier(supplierId);
        return ResponseEntity.ok(ApiResponse.ok(ratings));
    }

    @PostMapping("/supplier-ratings")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Создать оценку поставщика")
    public ResponseEntity<ApiResponse<SupplierRatingResponse>> createRating(
            @Valid @RequestBody CreateSupplierRatingRequest request) {
        SupplierRatingResponse response = procurementExtService.createRating(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/supplier-ratings/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Обновить оценку поставщика")
    public ResponseEntity<ApiResponse<SupplierRatingResponse>> updateRating(
            @PathVariable UUID id,
            @Valid @RequestBody CreateSupplierRatingRequest request) {
        SupplierRatingResponse response = procurementExtService.updateRating(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/supplier-ratings/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER')")
    @Operation(summary = "Удалить оценку поставщика (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> deleteRating(@PathVariable UUID id) {
        procurementExtService.deleteRating(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ========================================================================
    // Reservations
    // ========================================================================

    @PostMapping("/reservations/{id}/release")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPPLY_MANAGER', 'PROJECT_MANAGER')")
    @Operation(summary = "Снять резервирование материала")
    public ResponseEntity<ApiResponse<Void>> releaseReservation(@PathVariable UUID id) {
        procurementExtService.releaseReservation(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
