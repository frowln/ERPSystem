package com.privod.platform.modules.closeout.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.closeout.service.WarrantyObligationService;
import com.privod.platform.modules.closeout.service.WarrantyObligationService.WarrantyDashboardResponse;
import com.privod.platform.modules.closeout.web.dto.CreateWarrantyObligationRequest;
import com.privod.platform.modules.closeout.web.dto.UpdateWarrantyObligationRequest;
import com.privod.platform.modules.closeout.web.dto.WarrantyObligationResponse;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/closeout/warranty-obligations")
@RequiredArgsConstructor
@Tag(name = "Warranty Obligations", description = "Управление гарантийными обязательствами")
public class WarrantyObligationController {

    private final WarrantyObligationService obligationService;

    @GetMapping
    @Operation(summary = "Список гарантийных обязательств с пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<WarrantyObligationResponse>>> list(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<WarrantyObligationResponse> page = obligationService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить гарантийное обязательство по ID")
    public ResponseEntity<ApiResponse<WarrantyObligationResponse>> getById(@PathVariable UUID id) {
        WarrantyObligationResponse response = obligationService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/project/{projectId}")
    @Operation(summary = "Список гарантийных обязательств по проекту")
    public ResponseEntity<ApiResponse<List<WarrantyObligationResponse>>> getByProject(
            @PathVariable UUID projectId) {
        List<WarrantyObligationResponse> list = obligationService.findByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать гарантийное обязательство")
    public ResponseEntity<ApiResponse<WarrantyObligationResponse>> create(
            @Valid @RequestBody CreateWarrantyObligationRequest request) {
        WarrantyObligationResponse response = obligationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить гарантийное обязательство")
    public ResponseEntity<ApiResponse<WarrantyObligationResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateWarrantyObligationRequest request) {
        WarrantyObligationResponse response = obligationService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить гарантийное обязательство (мягкое удаление)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        obligationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Дашборд гарантийных обязательств")
    public ResponseEntity<ApiResponse<WarrantyDashboardResponse>> dashboard() {
        WarrantyDashboardResponse response = obligationService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
