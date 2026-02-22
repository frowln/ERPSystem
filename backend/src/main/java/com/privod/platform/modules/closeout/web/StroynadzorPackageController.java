package com.privod.platform.modules.closeout.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.closeout.service.StroynadzorPackageService;
import com.privod.platform.modules.closeout.web.dto.CompletenessReportResponse;
import com.privod.platform.modules.closeout.web.dto.CreateStroynadzorPackageRequest;
import com.privod.platform.modules.closeout.web.dto.MarkAsSentRequest;
import com.privod.platform.modules.closeout.web.dto.StroynadzorPackageDetailResponse;
import com.privod.platform.modules.closeout.web.dto.StroynadzorPackageResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/closeout/stroynadzor-package")
@RequiredArgsConstructor
@Tag(name = "Stroynadzor Package (Пакет для Стройнадзора)", description = "Генерация и управление пакетами документации для Стройнадзора")
public class StroynadzorPackageController {

    private final StroynadzorPackageService stroynadzorPackageService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать пакет для стройнадзора")
    public ResponseEntity<ApiResponse<StroynadzorPackageResponse>> createPackage(
            @Valid @RequestBody CreateStroynadzorPackageRequest request) {
        StroynadzorPackageResponse response = stroynadzorPackageService.createPackage(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Сгенерировать/обновить содержимое пакета")
    public ResponseEntity<ApiResponse<StroynadzorPackageDetailResponse>> generatePackage(@PathVariable UUID id) {
        StroynadzorPackageDetailResponse response = stroynadzorPackageService.generatePackage(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить пакет с документами")
    public ResponseEntity<ApiResponse<StroynadzorPackageDetailResponse>> getPackageDetail(@PathVariable UUID id) {
        StroynadzorPackageDetailResponse response = stroynadzorPackageService.getPackageDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/completeness")
    @Operation(summary = "Отчёт о полноте пакета")
    public ResponseEntity<ApiResponse<CompletenessReportResponse>> getCompletenessReport(@PathVariable UUID id) {
        CompletenessReportResponse response = stroynadzorPackageService.getCompletenessReport(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping
    @Operation(summary = "Список пакетов с фильтрацией по проекту")
    public ResponseEntity<ApiResponse<PageResponse<StroynadzorPackageResponse>>> listPackages(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<StroynadzorPackageResponse> page = stroynadzorPackageService.listPackages(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PatchMapping("/{id}/send")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Отметить пакет как отправленный")
    public ResponseEntity<ApiResponse<StroynadzorPackageResponse>> markAsSent(
            @PathVariable UUID id,
            @Valid @RequestBody MarkAsSentRequest request) {
        StroynadzorPackageResponse response = stroynadzorPackageService.markAsSent(id, request.sentTo());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Удалить пакет (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> deletePackage(@PathVariable UUID id) {
        stroynadzorPackageService.deletePackage(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
