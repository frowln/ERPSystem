package com.privod.platform.modules.ops.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.ops.domain.DefectStatus;
import com.privod.platform.modules.ops.domain.WorkOrderPriority;
import com.privod.platform.modules.ops.domain.WorkOrderStatus;
import com.privod.platform.modules.ops.service.OpsService;
import com.privod.platform.modules.ops.web.dto.CreateDailyReportRequest;
import com.privod.platform.modules.ops.web.dto.CreateDefectRequest;
import com.privod.platform.modules.ops.web.dto.CreateWorkOrderRequest;
import com.privod.platform.modules.ops.web.dto.DailyReportResponse;
import com.privod.platform.modules.ops.web.dto.DefectResponse;
import com.privod.platform.modules.ops.web.dto.UpdateWorkOrderRequest;
import com.privod.platform.modules.ops.web.dto.WorkOrderResponse;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/ops")
@RequiredArgsConstructor
@Tag(name = "Операции", description = "Управление полевыми операциями")
public class WorkOrderController {

    private final OpsService opsService;

    // ========================================================================
    // Work Orders
    // ========================================================================

    @GetMapping("/work-orders")
    @Operation(summary = "Список наряд-заданий с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<WorkOrderResponse>>> listWorkOrders(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) WorkOrderStatus status,
            @RequestParam(required = false) WorkOrderPriority priority,
            @RequestParam(required = false) UUID foremanId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<WorkOrderResponse> page = opsService.listWorkOrders(projectId, status, priority, foremanId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/work-orders/{id}")
    @Operation(summary = "Получить наряд-задание по ID")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> getWorkOrder(@PathVariable UUID id) {
        WorkOrderResponse response = opsService.getWorkOrder(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/work-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Создать наряд-задание")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> createWorkOrder(
            @Valid @RequestBody CreateWorkOrderRequest request) {
        WorkOrderResponse response = opsService.createWorkOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/work-orders/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Обновить наряд-задание")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> updateWorkOrder(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWorkOrderRequest request) {
        WorkOrderResponse response = opsService.updateWorkOrder(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/work-orders/{id}/plan")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Запланировать наряд-задание")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> planWorkOrder(@PathVariable UUID id) {
        WorkOrderResponse response = opsService.transitionWorkOrderStatus(id, WorkOrderStatus.PLANNED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/work-orders/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Начать выполнение наряд-задания")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> startWorkOrder(@PathVariable UUID id) {
        WorkOrderResponse response = opsService.transitionWorkOrderStatus(id, WorkOrderStatus.IN_PROGRESS);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/work-orders/{id}/hold")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Приостановить наряд-задание")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> holdWorkOrder(@PathVariable UUID id) {
        WorkOrderResponse response = opsService.transitionWorkOrderStatus(id, WorkOrderStatus.ON_HOLD);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/work-orders/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Завершить наряд-задание")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> completeWorkOrder(@PathVariable UUID id) {
        WorkOrderResponse response = opsService.transitionWorkOrderStatus(id, WorkOrderStatus.COMPLETED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/work-orders/{id}/cancel")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Отменить наряд-задание")
    public ResponseEntity<ApiResponse<WorkOrderResponse>> cancelWorkOrder(@PathVariable UUID id) {
        WorkOrderResponse response = opsService.transitionWorkOrderStatus(id, WorkOrderStatus.CANCELLED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/work-orders/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить наряд-задание (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> deleteWorkOrder(@PathVariable UUID id) {
        opsService.deleteWorkOrder(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ========================================================================
    // Daily Reports
    // ========================================================================

    @GetMapping("/work-orders/{workOrderId}/daily-reports")
    @Operation(summary = "Список ежедневных отчётов для наряд-задания")
    public ResponseEntity<ApiResponse<List<DailyReportResponse>>> getDailyReports(
            @PathVariable UUID workOrderId) {
        List<DailyReportResponse> reports = opsService.getDailyReportsForWorkOrder(workOrderId);
        return ResponseEntity.ok(ApiResponse.ok(reports));
    }

    @PostMapping("/daily-reports")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Создать ежедневный отчёт")
    public ResponseEntity<ApiResponse<DailyReportResponse>> createDailyReport(
            @Valid @RequestBody CreateDailyReportRequest request) {
        DailyReportResponse response = opsService.createDailyReport(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/daily-reports/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Обновить ежедневный отчёт")
    public ResponseEntity<ApiResponse<DailyReportResponse>> updateDailyReport(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDailyReportRequest request) {
        DailyReportResponse response = opsService.updateDailyReport(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/daily-reports/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить ежедневный отчёт (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> deleteDailyReport(@PathVariable UUID id) {
        opsService.deleteDailyReport(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ========================================================================
    // Defects
    // ========================================================================

    @GetMapping("/defects/{id}")
    @Operation(summary = "Получить дефект по ID")
    public ResponseEntity<ApiResponse<DefectResponse>> getDefect(@PathVariable UUID id) {
        DefectResponse response = opsService.getDefect(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/defects")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'INSPECTOR')")
    @Operation(summary = "Создать дефект")
    public ResponseEntity<ApiResponse<DefectResponse>> createDefect(
            @Valid @RequestBody CreateDefectRequest request) {
        DefectResponse response = opsService.createDefect(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/defects/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Начать исправление дефекта")
    public ResponseEntity<ApiResponse<DefectResponse>> startDefect(@PathVariable UUID id) {
        DefectResponse response = opsService.transitionDefectStatus(id, DefectStatus.IN_PROGRESS);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/defects/{id}/fix")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Отметить дефект как исправленный")
    public ResponseEntity<ApiResponse<DefectResponse>> fixDefect(@PathVariable UUID id) {
        DefectResponse response = opsService.transitionDefectStatus(id, DefectStatus.FIXED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/defects/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'INSPECTOR')")
    @Operation(summary = "Подтвердить исправление дефекта")
    public ResponseEntity<ApiResponse<DefectResponse>> verifyDefect(@PathVariable UUID id) {
        DefectResponse response = opsService.transitionDefectStatus(id, DefectStatus.VERIFIED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/defects/{id}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Закрыть дефект")
    public ResponseEntity<ApiResponse<DefectResponse>> closeDefect(@PathVariable UUID id) {
        DefectResponse response = opsService.transitionDefectStatus(id, DefectStatus.CLOSED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PutMapping("/defects/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'INSPECTOR')")
    @Operation(summary = "Обновить дефект")
    public ResponseEntity<ApiResponse<DefectResponse>> updateDefect(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDefectRequest request) {
        DefectResponse response = opsService.updateDefect(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/defects/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить дефект (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> deleteDefect(@PathVariable UUID id) {
        opsService.deleteDefect(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
