package com.privod.platform.modules.monitoring.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.monitoring.service.BackupService;
import com.privod.platform.modules.monitoring.web.dto.BackupRecordResponse;
import com.privod.platform.modules.monitoring.web.dto.StartBackupRequest;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/backups")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Backups", description = "Backup management endpoints")
public class BackupController {

    private final BackupService backupService;

    @PostMapping("/start")
    @Operation(summary = "Start a new backup")
    public ResponseEntity<ApiResponse<BackupRecordResponse>> startBackup(
            @Valid @RequestBody StartBackupRequest request) {
        BackupRecordResponse response = backupService.startBackup(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/status/{id}")
    @Operation(summary = "Get backup status by ID")
    public ResponseEntity<ApiResponse<BackupRecordResponse>> getStatus(@PathVariable UUID id) {
        BackupRecordResponse response = backupService.getStatus(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/latest")
    @Operation(summary = "Get latest backup record")
    public ResponseEntity<ApiResponse<BackupRecordResponse>> getLatest() {
        BackupRecordResponse response = backupService.getLatest();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/history")
    @Operation(summary = "Get backup history")
    public ResponseEntity<ApiResponse<PageResponse<BackupRecordResponse>>> getHistory(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<BackupRecordResponse> page = backupService.getHistory(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
