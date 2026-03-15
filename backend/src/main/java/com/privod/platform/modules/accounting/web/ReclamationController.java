package com.privod.platform.modules.accounting.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.accounting.domain.ReclamationStatus;
import com.privod.platform.modules.accounting.service.ReclamationService;
import com.privod.platform.modules.accounting.web.dto.CreateReclamationRequest;
import com.privod.platform.modules.accounting.web.dto.ReclamationResponse;
import com.privod.platform.modules.accounting.web.dto.UpdateReclamationRequest;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/reclamations")
@RequiredArgsConstructor
@Tag(name = "Рекламации", description = "Управление рекламациями (претензиями)")
public class ReclamationController {

    private final ReclamationService reclamationService;

    @GetMapping
    @Operation(summary = "Список рекламаций")
    public ResponseEntity<ApiResponse<PageResponse<ReclamationResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) ReclamationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ReclamationResponse> page = reclamationService.list(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить рекламацию по ID")
    public ResponseEntity<ApiResponse<ReclamationResponse>> getById(@PathVariable UUID id) {
        ReclamationResponse response = reclamationService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Создать новую рекламацию")
    public ResponseEntity<ApiResponse<ReclamationResponse>> create(
            @Valid @RequestBody CreateReclamationRequest request) {
        ReclamationResponse response = reclamationService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Обновить рекламацию")
    public ResponseEntity<ApiResponse<ReclamationResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateReclamationRequest request) {
        ReclamationResponse response = reclamationService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить рекламацию")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        reclamationService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
