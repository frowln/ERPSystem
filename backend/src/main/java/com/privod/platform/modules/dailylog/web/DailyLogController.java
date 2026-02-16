package com.privod.platform.modules.dailylog.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.dailylog.service.DailyLogEntryService;
import com.privod.platform.modules.dailylog.service.DailyLogService;
import com.privod.platform.modules.dailylog.web.dto.CreateDailyLogEntryRequest;
import com.privod.platform.modules.dailylog.web.dto.CreateDailyLogPhotoRequest;
import com.privod.platform.modules.dailylog.web.dto.CreateDailyLogRequest;
import com.privod.platform.modules.dailylog.web.dto.DailyLogEntryResponse;
import com.privod.platform.modules.dailylog.web.dto.DailyLogPhotoResponse;
import com.privod.platform.modules.dailylog.web.dto.DailyLogResponse;
import com.privod.platform.modules.dailylog.web.dto.UpdateDailyLogEntryRequest;
import com.privod.platform.modules.dailylog.web.dto.UpdateDailyLogRequest;
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
import org.springframework.web.bind.annotation.PatchMapping;
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
@RequestMapping("/api/daily-logs")
@RequiredArgsConstructor
@Tag(name = "Daily Construction Log (KS-6)", description = "Daily construction log management endpoints")
public class DailyLogController {

    private final DailyLogService dailyLogService;
    private final DailyLogEntryService entryService;

    // ---- Daily Log CRUD ----

    @GetMapping
    @Operation(summary = "List daily logs with optional project filter")
    public ResponseEntity<ApiResponse<PageResponse<DailyLogResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "logDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DailyLogResponse> page = dailyLogService.listLogs(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get daily log by ID")
    public ResponseEntity<ApiResponse<DailyLogResponse>> getById(@PathVariable UUID id) {
        DailyLogResponse response = dailyLogService.getLog(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/by-date")
    @Operation(summary = "Get daily log by project and date")
    public ResponseEntity<ApiResponse<DailyLogResponse>> getByDate(
            @RequestParam UUID projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        DailyLogResponse response = dailyLogService.getLogByProjectAndDate(projectId, date);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/date-range")
    @Operation(summary = "Get daily logs by project and date range")
    public ResponseEntity<ApiResponse<List<DailyLogResponse>>> getByDateRange(
            @RequestParam UUID projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<DailyLogResponse> logs = dailyLogService.getByDateRange(projectId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(logs));
    }

    @GetMapping("/timeline/{projectId}")
    @Operation(summary = "Get full project daily log timeline")
    public ResponseEntity<ApiResponse<List<DailyLogResponse>>> getTimeline(@PathVariable UUID projectId) {
        List<DailyLogResponse> timeline = dailyLogService.getProjectTimeline(projectId);
        return ResponseEntity.ok(ApiResponse.ok(timeline));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'ENGINEER')")
    @Operation(summary = "Create a new daily log")
    public ResponseEntity<ApiResponse<DailyLogResponse>> create(
            @Valid @RequestBody CreateDailyLogRequest request) {
        DailyLogResponse response = dailyLogService.createLog(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'ENGINEER')")
    @Operation(summary = "Update a daily log")
    public ResponseEntity<ApiResponse<DailyLogResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDailyLogRequest request) {
        DailyLogResponse response = dailyLogService.updateLog(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Submit daily log for approval")
    public ResponseEntity<ApiResponse<DailyLogResponse>> submit(@PathVariable UUID id) {
        DailyLogResponse response = dailyLogService.submitLog(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Approve a submitted daily log")
    public ResponseEntity<ApiResponse<DailyLogResponse>> approve(@PathVariable UUID id) {
        DailyLogResponse response = dailyLogService.approveLog(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a daily log")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        dailyLogService.deleteLog(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Entries ----

    @GetMapping("/{id}/entries")
    @Operation(summary = "List entries for a daily log")
    public ResponseEntity<ApiResponse<PageResponse<DailyLogEntryResponse>>> listEntries(
            @PathVariable UUID id,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<DailyLogEntryResponse> page = entryService.listEntries(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}/entries/{entryId}")
    @Operation(summary = "Get a specific entry by ID")
    public ResponseEntity<ApiResponse<DailyLogEntryResponse>> getEntry(
            @PathVariable UUID id, @PathVariable UUID entryId) {
        DailyLogEntryResponse response = entryService.getEntry(id, entryId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/entries")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'ENGINEER')")
    @Operation(summary = "Add entry to daily log")
    public ResponseEntity<ApiResponse<DailyLogEntryResponse>> createEntry(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDailyLogEntryRequest request) {
        DailyLogEntryResponse response = entryService.createEntry(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/entries/{entryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'ENGINEER')")
    @Operation(summary = "Update a daily log entry")
    public ResponseEntity<ApiResponse<DailyLogEntryResponse>> updateEntry(
            @PathVariable UUID id, @PathVariable UUID entryId,
            @Valid @RequestBody UpdateDailyLogEntryRequest request) {
        DailyLogEntryResponse response = entryService.updateEntry(id, entryId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}/entries/{entryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Delete a daily log entry")
    public ResponseEntity<ApiResponse<Void>> deleteEntry(
            @PathVariable UUID id, @PathVariable UUID entryId) {
        entryService.deleteEntry(id, entryId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Photos ----

    @GetMapping("/{id}/photos")
    @Operation(summary = "List photos for a daily log")
    public ResponseEntity<ApiResponse<PageResponse<DailyLogPhotoResponse>>> listPhotos(
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DailyLogPhotoResponse> page = dailyLogService.listPhotos(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/{id}/photos")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN', 'ENGINEER')")
    @Operation(summary = "Add photo to daily log")
    public ResponseEntity<ApiResponse<DailyLogPhotoResponse>> addPhoto(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDailyLogPhotoRequest request) {
        DailyLogPhotoResponse response = dailyLogService.addPhoto(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}/photos/{photoId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FOREMAN')")
    @Operation(summary = "Delete a photo from daily log")
    public ResponseEntity<ApiResponse<Void>> deletePhoto(
            @PathVariable UUID id, @PathVariable UUID photoId) {
        dailyLogService.deletePhoto(id, photoId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
