package com.privod.platform.modules.planning.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.planning.service.ResourceAllocationService;
import com.privod.platform.modules.planning.web.dto.CreateResourceAllocationRequest;
import com.privod.platform.modules.planning.web.dto.ResourceAllocationResponse;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resource-allocations")
@RequiredArgsConstructor
@Tag(name = "Resource Allocations", description = "Управление распределением ресурсов")
public class ResourceAllocationController {

    private final ResourceAllocationService allocationService;

    @GetMapping
    @Operation(summary = "Получить распределения ресурсов для узла WBS с пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<ResourceAllocationResponse>>> list(
            @RequestParam(required = false) UUID wbsNodeId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ResourceAllocationResponse> page = allocationService.findByWbsNode(wbsNodeId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/all")
    @Operation(summary = "Получить все распределения ресурсов для узла WBS")
    public ResponseEntity<ApiResponse<List<ResourceAllocationResponse>>> listAll(@RequestParam UUID wbsNodeId) {
        List<ResourceAllocationResponse> allocations = allocationService.findAllByWbsNode(wbsNodeId);
        return ResponseEntity.ok(ApiResponse.ok(allocations));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить распределение ресурса по ID")
    public ResponseEntity<ApiResponse<ResourceAllocationResponse>> getById(@PathVariable UUID id) {
        ResourceAllocationResponse response = allocationService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Создать распределение ресурса")
    public ResponseEntity<ApiResponse<ResourceAllocationResponse>> create(
            @Valid @RequestBody CreateResourceAllocationRequest request) {
        ResourceAllocationResponse response = allocationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить распределение ресурса (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        allocationService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
