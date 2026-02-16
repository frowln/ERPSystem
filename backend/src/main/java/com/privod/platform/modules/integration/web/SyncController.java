package com.privod.platform.modules.integration.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.integration.service.SyncMappingService;
import com.privod.platform.modules.integration.service.SyncService;
import com.privod.platform.modules.integration.web.dto.CreateSyncMappingRequest;
import com.privod.platform.modules.integration.web.dto.StartSyncRequest;
import com.privod.platform.modules.integration.web.dto.SyncJobResponse;
import com.privod.platform.modules.integration.web.dto.SyncMappingResponse;
import com.privod.platform.modules.integration.web.dto.UpdateSyncMappingRequest;
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
@RequestMapping("/api/admin/integrations/sync")
@RequiredArgsConstructor
@Tag(name = "Sync Jobs", description = "Управление заданиями синхронизации")
public class SyncController {

    private final SyncService syncService;
    private final SyncMappingService syncMappingService;

    @PostMapping("/start")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Запустить синхронизацию")
    public ResponseEntity<ApiResponse<SyncJobResponse>> startSync(
            @Valid @RequestBody StartSyncRequest request) {
        SyncJobResponse response = syncService.startSync(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Отменить синхронизацию")
    public ResponseEntity<ApiResponse<SyncJobResponse>> cancelSync(@PathVariable UUID id) {
        SyncJobResponse response = syncService.cancelSync(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/retry")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Повторить неудачную синхронизацию")
    public ResponseEntity<ApiResponse<SyncJobResponse>> retrySync(@PathVariable UUID id) {
        SyncJobResponse response = syncService.retryFailed(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить задание синхронизации по ID")
    public ResponseEntity<ApiResponse<SyncJobResponse>> getById(@PathVariable UUID id) {
        SyncJobResponse response = syncService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/history")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "История синхронизации")
    public ResponseEntity<ApiResponse<PageResponse<SyncJobResponse>>> history(
            @RequestParam(required = false) UUID endpointId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<SyncJobResponse> page = syncService.getSyncHistory(endpointId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/last")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Последняя синхронизация по endpoint и entityType")
    public ResponseEntity<ApiResponse<SyncJobResponse>> getLastSync(
            @RequestParam UUID endpointId,
            @RequestParam String entityType) {
        SyncJobResponse response = syncService.getLastSync(endpointId, entityType);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ---- Sync Mappings ----

    @GetMapping("/mappings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Список маппингов полей")
    public ResponseEntity<ApiResponse<PageResponse<SyncMappingResponse>>> listMappings(
            @RequestParam(required = false) UUID endpointId,
            @PageableDefault(size = 50, sort = "createdAt", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<SyncMappingResponse> page = syncMappingService.findAll(endpointId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/mappings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить маппинг по ID")
    public ResponseEntity<ApiResponse<SyncMappingResponse>> getMappingById(@PathVariable UUID id) {
        SyncMappingResponse response = syncMappingService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/mappings/fields")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Получить маппинг полей для типа сущности")
    public ResponseEntity<ApiResponse<List<SyncMappingResponse>>> getFieldMappings(
            @RequestParam UUID endpointId,
            @RequestParam String localEntityType) {
        List<SyncMappingResponse> responses = syncMappingService.getFieldMapping(endpointId, localEntityType);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @PostMapping("/mappings")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Создать маппинг полей")
    public ResponseEntity<ApiResponse<SyncMappingResponse>> createMapping(
            @Valid @RequestBody CreateSyncMappingRequest request) {
        SyncMappingResponse response = syncMappingService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/mappings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Обновить маппинг полей")
    public ResponseEntity<ApiResponse<SyncMappingResponse>> updateMapping(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSyncMappingRequest request) {
        SyncMappingResponse response = syncMappingService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/mappings/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить маппинг полей")
    public ResponseEntity<ApiResponse<Void>> deleteMapping(@PathVariable UUID id) {
        syncMappingService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
