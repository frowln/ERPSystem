package com.privod.platform.modules.planning.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.planning.service.WorkVolumeService;
import com.privod.platform.modules.planning.web.dto.CreateWorkVolumeEntryRequest;
import com.privod.platform.modules.planning.web.dto.WorkVolumeEntryResponse;
import com.privod.platform.modules.planning.web.dto.WorkVolumeSummaryResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
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

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/work-volumes")
@RequiredArgsConstructor
@Tag(name = "Work Volumes", description = "Учёт объёмов работ с привязкой к WBS")
public class WorkVolumeController {

    private final WorkVolumeService workVolumeService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Получить записи объёмов работ проекта")
    public ResponseEntity<ApiResponse<PageResponse<WorkVolumeEntryResponse>>> list(
            @RequestParam UUID projectId,
            @PageableDefault(size = 50, sort = "recordDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WorkVolumeEntryResponse> page = workVolumeService.findByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Получить запись объёма работ по ID")
    public ResponseEntity<ApiResponse<WorkVolumeEntryResponse>> getById(@PathVariable UUID id) {
        WorkVolumeEntryResponse response = workVolumeService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/by-date")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Получить записи объёмов за указанную дату")
    public ResponseEntity<ApiResponse<List<WorkVolumeEntryResponse>>> getByDate(
            @RequestParam UUID projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<WorkVolumeEntryResponse> entries = workVolumeService.findByProjectAndDate(projectId, date);
        return ResponseEntity.ok(ApiResponse.ok(entries));
    }

    @GetMapping("/summary")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Сводка объёмов по узлам WBS проекта")
    public ResponseEntity<ApiResponse<List<WorkVolumeSummaryResponse>>> getSummary(
            @RequestParam UUID projectId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<WorkVolumeSummaryResponse> summary = workVolumeService.getVolumeSummary(
                projectId, date != null ? date : LocalDate.now());
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать запись объёма работ")
    public ResponseEntity<ApiResponse<WorkVolumeEntryResponse>> create(
            @Valid @RequestBody CreateWorkVolumeEntryRequest request) {
        WorkVolumeEntryResponse response = workVolumeService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить запись объёма работ")
    public ResponseEntity<ApiResponse<WorkVolumeEntryResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateWorkVolumeEntryRequest request) {
        WorkVolumeEntryResponse response = workVolumeService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'MANAGER')")
    @Operation(summary = "Удалить запись объёма работ")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        workVolumeService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
