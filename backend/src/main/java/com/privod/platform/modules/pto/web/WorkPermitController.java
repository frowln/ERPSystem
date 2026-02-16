package com.privod.platform.modules.pto.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.pto.domain.WorkPermitStatus;
import com.privod.platform.modules.pto.service.WorkPermitService;
import com.privod.platform.modules.pto.web.dto.CreateWorkPermitRequest;
import com.privod.platform.modules.pto.web.dto.WorkPermitResponse;
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
@RequestMapping("/api/pto/work-permits")
@RequiredArgsConstructor
@Tag(name = "Work Permits", description = "Управление нарядами-допусками")
public class WorkPermitController {

    private final WorkPermitService workPermitService;

    @GetMapping
    @Operation(summary = "Список нарядов-допусков")
    public ResponseEntity<ApiResponse<PageResponse<WorkPermitResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) WorkPermitStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WorkPermitResponse> page = workPermitService.listWorkPermits(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить наряд-допуск по ID")
    public ResponseEntity<ApiResponse<WorkPermitResponse>> getById(@PathVariable UUID id) {
        WorkPermitResponse response = workPermitService.getWorkPermit(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать наряд-допуск")
    public ResponseEntity<ApiResponse<WorkPermitResponse>> create(
            @Valid @RequestBody CreateWorkPermitRequest request) {
        WorkPermitResponse response = workPermitService.createWorkPermit(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Изменить статус наряда-допуска")
    public ResponseEntity<ApiResponse<WorkPermitResponse>> changeStatus(
            @PathVariable UUID id,
            @RequestParam WorkPermitStatus status) {
        WorkPermitResponse response = workPermitService.changeStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить наряд-допуск")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        workPermitService.deleteWorkPermit(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
