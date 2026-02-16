package com.privod.platform.modules.estimate.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.estimate.domain.EstimateStatus;
import com.privod.platform.modules.estimate.service.EstimateService;
import com.privod.platform.modules.estimate.web.dto.ChangeEstimateStatusRequest;
import com.privod.platform.modules.estimate.web.dto.CreateEstimateItemRequest;
import com.privod.platform.modules.estimate.web.dto.CreateEstimateRequest;
import com.privod.platform.modules.estimate.web.dto.CreateFromSpecRequest;
import com.privod.platform.modules.estimate.web.dto.CreateVersionRequest;
import com.privod.platform.modules.estimate.web.dto.EstimateFinancialSummaryResponse;
import com.privod.platform.modules.estimate.web.dto.EstimateItemResponse;
import com.privod.platform.modules.estimate.web.dto.EstimateListResponse;
import com.privod.platform.modules.estimate.web.dto.EstimateResponse;
import com.privod.platform.modules.estimate.web.dto.UpdateEstimateItemRequest;
import com.privod.platform.modules.estimate.web.dto.UpdateEstimateRequest;
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
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/api/estimates")
@RequiredArgsConstructor
@Tag(name = "Estimates", description = "Управление сметами")
public class EstimateController {

    private final EstimateService estimateService;

    @GetMapping
    @Operation(summary = "Список смет с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<EstimateListResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID specificationId,
            @RequestParam(required = false) EstimateStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<EstimateListResponse> page = estimateService.listEstimates(projectId, specificationId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить смету по ID с позициями")
    public ResponseEntity<ApiResponse<EstimateResponse>> getById(@PathVariable UUID id) {
        EstimateResponse response = estimateService.getEstimate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать новую смету")
    public ResponseEntity<ApiResponse<EstimateResponse>> create(
            @Valid @RequestBody CreateEstimateRequest request) {
        EstimateResponse response = estimateService.createEstimate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить смету")
    public ResponseEntity<ApiResponse<EstimateResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateEstimateRequest request) {
        EstimateResponse response = estimateService.updateEstimate(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Изменить статус сметы")
    public ResponseEntity<ApiResponse<EstimateResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeEstimateStatusRequest request) {
        EstimateResponse response = estimateService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/from-specification")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать смету из спецификации")
    public ResponseEntity<ApiResponse<EstimateResponse>> createFromSpecification(
            @Valid @RequestBody CreateFromSpecRequest request) {
        EstimateResponse response = estimateService.createFromSpecification(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/items")
    @Operation(summary = "Получить позиции сметы")
    public ResponseEntity<ApiResponse<List<EstimateItemResponse>>> getItems(@PathVariable UUID id) {
        List<EstimateItemResponse> items = estimateService.getItems(id);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить позицию в смету")
    public ResponseEntity<ApiResponse<EstimateItemResponse>> addItem(
            @PathVariable UUID id,
            @Valid @RequestBody CreateEstimateItemRequest request) {
        EstimateItemResponse response = estimateService.addItem(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить позицию сметы")
    public ResponseEntity<ApiResponse<EstimateItemResponse>> updateItem(
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateEstimateItemRequest request) {
        EstimateItemResponse response = estimateService.updateItem(itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Удалить позицию сметы")
    public ResponseEntity<ApiResponse<Void>> removeItem(@PathVariable UUID itemId) {
        estimateService.removeItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/recalculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Пересчитать итоговые суммы сметы")
    public ResponseEntity<ApiResponse<EstimateResponse>> recalculate(@PathVariable UUID id) {
        EstimateResponse response = estimateService.recalculateTotals(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/version")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Создать версию-снимок сметы")
    public ResponseEntity<ApiResponse<Void>> createVersion(
            @PathVariable UUID id,
            @Valid @RequestBody CreateVersionRequest request) {
        estimateService.createVersion(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok());
    }

    @GetMapping("/{id}/financial-summary")
    @Operation(summary = "Финансовая сводка по смете")
    public ResponseEntity<ApiResponse<EstimateFinancialSummaryResponse>> getFinancialSummary(
            @PathVariable UUID id) {
        EstimateFinancialSummaryResponse response = estimateService.getFinancialSummary(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/project/{projectId}/summary")
    @Operation(summary = "Финансовая сводка по всем сметам проекта")
    public ResponseEntity<ApiResponse<EstimateFinancialSummaryResponse>> getProjectSummary(
            @PathVariable UUID projectId) {
        EstimateFinancialSummaryResponse response = estimateService.getProjectEstimateSummary(projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
