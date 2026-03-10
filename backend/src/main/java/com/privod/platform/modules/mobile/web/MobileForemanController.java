package com.privod.platform.modules.mobile.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.mobile.service.MobileForemanService;
import com.privod.platform.modules.mobile.web.dto.CreateFieldReportRequest;
import com.privod.platform.modules.mobile.web.dto.FieldReportResponse;
import com.privod.platform.modules.mobile.web.dto.FieldReportPhotoResponse;
import com.privod.platform.modules.mobile.web.dto.MobileTaskResponse;
import com.privod.platform.modules.mobile.web.dto.SyncStatusResponse;
import com.privod.platform.modules.mobile.web.dto.UpdateFieldReportRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Mobile Foreman REST controller.
 * Serves the field-report, task, photo, and sync endpoints
 * consumed by the frontend mobile module ({@code /api/mobile/...}).
 */
@RestController
@RequestMapping("/api/mobile")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Mobile Foreman", description = "Мобильный прораб — полевые отчёты, задачи, фото, синхронизация")
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'PROJECT_MANAGER', 'ENGINEER', 'FOREMAN')")
public class MobileForemanController {

    private final MobileForemanService mobileForemanService;

    // ========================================================================
    // Field Reports
    // ========================================================================

    @GetMapping("/field-reports")
    @Operation(summary = "Список полевых отчётов с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<FieldReportResponse>>> listFieldReports(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LocalDate dateFrom,
            @RequestParam(required = false) LocalDate dateTo,
            @PageableDefault(size = 20, sort = "reportDate", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<FieldReportResponse> page = mobileForemanService.listFieldReports(
                status, projectId, search, dateFrom, dateTo, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/field-reports/{id}")
    @Operation(summary = "Получить полевой отчёт по ID")
    public ResponseEntity<ApiResponse<FieldReportResponse>> getFieldReport(@PathVariable UUID id) {
        FieldReportResponse response = mobileForemanService.getFieldReport(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/field-reports")
    @Operation(summary = "Создать полевой отчёт")
    public ResponseEntity<ApiResponse<FieldReportResponse>> createFieldReport(
            @Valid @RequestBody CreateFieldReportRequest request) {
        FieldReportResponse response = mobileForemanService.createFieldReport(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/field-reports/{id}")
    @Operation(summary = "Обновить полевой отчёт")
    public ResponseEntity<ApiResponse<FieldReportResponse>> updateFieldReport(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateFieldReportRequest request) {
        FieldReportResponse response = mobileForemanService.updateFieldReport(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/field-reports/{id}/submit")
    @Operation(summary = "Отправить полевой отчёт на проверку")
    public ResponseEntity<ApiResponse<FieldReportResponse>> submitFieldReport(@PathVariable UUID id) {
        FieldReportResponse response = mobileForemanService.submitFieldReport(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ========================================================================
    // Photos (linked to field reports)
    // ========================================================================

    @PostMapping(value = "/field-reports/{reportId}/photos", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Загрузить фото к полевому отчёту")
    public ResponseEntity<ApiResponse<FieldReportPhotoResponse>> uploadPhoto(
            @PathVariable UUID reportId,
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) String caption) {

        // In a production system this would upload the file to S3/MinIO
        // and return the URL. For now we use a placeholder URL based on the filename.
        String photoUrl = "/uploads/photos/" + UUID.randomUUID() + "_" + file.getOriginalFilename();

        FieldReportPhotoResponse response = mobileForemanService.uploadPhotoForReport(reportId, photoUrl, caption);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping("/field-reports/{reportId}/photos")
    @Operation(summary = "Фотографии полевого отчёта")
    public ResponseEntity<ApiResponse<List<FieldReportPhotoResponse>>> getPhotosForReport(
            @PathVariable UUID reportId) {
        List<FieldReportPhotoResponse> photos = mobileForemanService.getPhotosForReport(reportId);
        return ResponseEntity.ok(ApiResponse.ok(photos));
    }

    // ========================================================================
    // Sync
    // ========================================================================

    @GetMapping("/sync/status")
    @Operation(summary = "Статус синхронизации")
    public ResponseEntity<ApiResponse<SyncStatusResponse>> getSyncStatus() {
        SyncStatusResponse response = mobileForemanService.getSyncStatus();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/sync/trigger")
    @Operation(summary = "Запустить синхронизацию")
    public ResponseEntity<ApiResponse<Void>> triggerSync() {
        mobileForemanService.triggerSync();
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ========================================================================
    // Mobile Tasks
    // ========================================================================

    @GetMapping("/tasks")
    @Operation(summary = "Задачи текущего пользователя для мобильного")
    public ResponseEntity<ApiResponse<PageResponse<MobileTaskResponse>>> getMobileTasks(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<MobileTaskResponse> page = mobileForemanService.getMobileTasks(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PatchMapping("/tasks/{id}/complete")
    @Operation(summary = "Завершить задачу")
    public ResponseEntity<ApiResponse<MobileTaskResponse>> completeTask(@PathVariable UUID id) {
        MobileTaskResponse response = mobileForemanService.completeTask(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
