package com.privod.platform.modules.estimate.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.estimate.domain.LocalEstimateStatus;
import com.privod.platform.modules.estimate.service.LocalEstimateService;
import com.privod.platform.modules.estimate.web.dto.AddEstimateLineRequest;
import com.privod.platform.modules.estimate.web.dto.CreateLocalEstimateRequest;
import com.privod.platform.modules.estimate.web.dto.ImportMinstroyIndicesRequest;
import com.privod.platform.modules.estimate.web.dto.LocalEstimateDetailResponse;
import com.privod.platform.modules.estimate.web.dto.LocalEstimateLineResponse;
import com.privod.platform.modules.estimate.web.dto.LocalEstimateResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/estimates/local")
@RequiredArgsConstructor
@Tag(name = "Local Estimates (Локальные сметы)", description = "Управление локальными сметами с нормативными расценками ГЭСН/ФЕР/ТЕР")
public class LocalEstimateController {

    private final LocalEstimateService localEstimateService;

    @GetMapping
    @Operation(summary = "Список локальных смет с фильтрацией")
    public ResponseEntity<ApiResponse<PageResponse<LocalEstimateResponse>>> listEstimates(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) LocalEstimateStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<LocalEstimateResponse> page = localEstimateService.listEstimates(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить локальную смету с позициями")
    public ResponseEntity<ApiResponse<LocalEstimateDetailResponse>> getEstimate(@PathVariable UUID id) {
        LocalEstimateDetailResponse response = localEstimateService.getEstimate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать локальную смету")
    public ResponseEntity<ApiResponse<LocalEstimateResponse>> createEstimate(
            @Valid @RequestBody CreateLocalEstimateRequest request) {
        LocalEstimateResponse response = localEstimateService.createEstimate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/lines")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить строку в локальную смету")
    public ResponseEntity<ApiResponse<LocalEstimateLineResponse>> addLine(
            @PathVariable UUID id,
            @Valid @RequestBody AddEstimateLineRequest request) {
        LocalEstimateLineResponse response = localEstimateService.addLine(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}/lines/{lineId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Удалить строку из локальной сметы")
    public ResponseEntity<ApiResponse<Void>> removeLine(
            @PathVariable UUID id,
            @PathVariable UUID lineId) {
        localEstimateService.removeLine(id, lineId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/{id}/calculate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Рассчитать локальную смету с применением индексов пересчёта")
    public ResponseEntity<ApiResponse<LocalEstimateDetailResponse>> calculateEstimate(@PathVariable UUID id) {
        LocalEstimateDetailResponse response = localEstimateService.calculateEstimate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Утвердить локальную смету")
    public ResponseEntity<ApiResponse<LocalEstimateResponse>> approveEstimate(@PathVariable UUID id) {
        LocalEstimateResponse response = localEstimateService.approveEstimate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить локальную смету")
    public ResponseEntity<ApiResponse<Void>> deleteEstimate(@PathVariable UUID id) {
        localEstimateService.deleteEstimate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @PostMapping("/import-indices")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Импорт квартальных индексов Минстроя")
    public ResponseEntity<ApiResponse<Integer>> importMinstroyIndices(
            @Valid @RequestBody ImportMinstroyIndicesRequest request) {
        int count = localEstimateService.importMinstroyIndices(request);
        return ResponseEntity.ok(ApiResponse.ok(count));
    }
}
