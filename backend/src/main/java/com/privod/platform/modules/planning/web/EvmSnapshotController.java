package com.privod.platform.modules.planning.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.planning.service.EvmSnapshotService;
import com.privod.platform.modules.planning.web.dto.CreateEvmSnapshotRequest;
import com.privod.platform.modules.planning.web.dto.EvmSnapshotResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/evm-snapshots")
@RequiredArgsConstructor
@Tag(name = "EVM Snapshots", description = "Управление снимками освоенного объёма")
public class EvmSnapshotController {

    private final EvmSnapshotService evmSnapshotService;

    @GetMapping
    @Operation(summary = "Получить EVM снимки проекта с пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<EvmSnapshotResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "snapshotDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EvmSnapshotResponse> page = evmSnapshotService.findByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить EVM снимок по ID")
    public ResponseEntity<ApiResponse<EvmSnapshotResponse>> getById(@PathVariable UUID id) {
        EvmSnapshotResponse response = evmSnapshotService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/latest")
    @Operation(summary = "Получить последний EVM снимок проекта")
    public ResponseEntity<ApiResponse<EvmSnapshotResponse>> getLatest(@RequestParam UUID projectId) {
        return evmSnapshotService.findLatest(projectId)
                .map(r -> ResponseEntity.ok(ApiResponse.ok(r)))
                .orElse(ResponseEntity.ok(ApiResponse.ok()));
    }

    @GetMapping("/indicators")
    @Operation(summary = "Получить EVM индикаторы проекта (из последнего снимка или дефолтные)")
    public ResponseEntity<ApiResponse<EvmSnapshotResponse>> getIndicators(@RequestParam UUID projectId) {
        return evmSnapshotService.findLatest(projectId)
                .map(r -> ResponseEntity.ok(ApiResponse.ok(r)))
                .orElse(ResponseEntity.ok(ApiResponse.ok()));
    }

    @GetMapping("/range")
    @Operation(summary = "Получить EVM снимки проекта за период")
    public ResponseEntity<ApiResponse<List<EvmSnapshotResponse>>> getByDateRange(
            @RequestParam UUID projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<EvmSnapshotResponse> snapshots = evmSnapshotService.findByDateRange(projectId, from, to);
        return ResponseEntity.ok(ApiResponse.ok(snapshots));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Создать EVM снимок")
    public ResponseEntity<ApiResponse<EvmSnapshotResponse>> create(
            @Valid @RequestBody CreateEvmSnapshotRequest request) {
        EvmSnapshotResponse response = evmSnapshotService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить EVM снимок (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        evmSnapshotService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
