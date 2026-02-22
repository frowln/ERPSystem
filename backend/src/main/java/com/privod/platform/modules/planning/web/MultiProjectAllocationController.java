package com.privod.platform.modules.planning.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.planning.domain.MultiProjectResourceType;
import com.privod.platform.modules.planning.service.MultiProjectAllocationService;
import com.privod.platform.modules.planning.web.dto.AllocationConflictResponse;
import com.privod.platform.modules.planning.web.dto.CreateMultiProjectAllocationRequest;
import com.privod.platform.modules.planning.web.dto.MultiProjectAllocationResponse;
import com.privod.platform.modules.planning.web.dto.ResourceSuggestionResponse;
import com.privod.platform.modules.planning.web.dto.UpdateMultiProjectAllocationRequest;
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
@RequestMapping("/api/planning/multi-project-allocation")
@RequiredArgsConstructor
@Tag(name = "Multi-Project Allocation", description = "Управление мульти-проектным распределением ресурсов")
public class MultiProjectAllocationController {

    private final MultiProjectAllocationService allocationService;

    @GetMapping
    @Operation(summary = "Получить распределения ресурсов с фильтрами")
    public ResponseEntity<ApiResponse<List<MultiProjectAllocationResponse>>> list(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<UUID> projectIds,
            @RequestParam(required = false) MultiProjectResourceType resourceType) {
        List<MultiProjectAllocationResponse> allocations = allocationService.getAllocationsByDateRange(
                startDate, endDate, projectIds, resourceType);
        return ResponseEntity.ok(ApiResponse.ok(allocations));
    }

    @GetMapping("/paged")
    @Operation(summary = "Получить распределения ресурсов с пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<MultiProjectAllocationResponse>>> listPaged(
            @PageableDefault(size = 20, sort = "startDate", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<MultiProjectAllocationResponse> page = allocationService.getAllocations(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Создать распределение ресурса на проект")
    public ResponseEntity<ApiResponse<MultiProjectAllocationResponse>> create(
            @Valid @RequestBody CreateMultiProjectAllocationRequest request) {
        MultiProjectAllocationResponse response = allocationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Обновить распределение ресурса")
    public ResponseEntity<ApiResponse<MultiProjectAllocationResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMultiProjectAllocationRequest request) {
        MultiProjectAllocationResponse response = allocationService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить распределение ресурса (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        allocationService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/conflicts")
    @Operation(summary = "Обнаружить конфликты распределения ресурсов в указанном периоде")
    public ResponseEntity<ApiResponse<List<AllocationConflictResponse>>> detectConflicts(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<AllocationConflictResponse> conflicts = allocationService.detectConflicts(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(conflicts));
    }

    @GetMapping("/suggestions")
    @Operation(summary = "Получить рекомендации по ресурсам для проекта")
    public ResponseEntity<ApiResponse<List<ResourceSuggestionResponse>>> getSuggestions(
            @RequestParam UUID projectId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) List<String> skills) {
        List<ResourceSuggestionResponse> suggestions = allocationService.getResourceSuggestions(
                projectId, startDate, endDate, skills);
        return ResponseEntity.ok(ApiResponse.ok(suggestions));
    }
}
