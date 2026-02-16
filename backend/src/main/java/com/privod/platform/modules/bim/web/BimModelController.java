package com.privod.platform.modules.bim.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.bim.service.BimModelService;
import com.privod.platform.modules.bim.web.dto.BimModelResponse;
import com.privod.platform.modules.bim.web.dto.CreateBimModelRequest;
import com.privod.platform.modules.bim.web.dto.UpdateBimModelRequest;
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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/bim/models")
@RequiredArgsConstructor
@Tag(name = "BIM Models", description = "Управление BIM моделями")
public class BimModelController {

    private final BimModelService bimModelService;

    @GetMapping
    @Operation(summary = "Список BIM моделей с фильтрацией по проекту")
    public ResponseEntity<ApiResponse<PageResponse<BimModelResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<BimModelResponse> page = bimModelService.listModels(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить BIM модель по ID")
    public ResponseEntity<ApiResponse<BimModelResponse>> getById(@PathVariable UUID id) {
        BimModelResponse response = bimModelService.getModel(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать новую BIM модель")
    public ResponseEntity<ApiResponse<BimModelResponse>> create(
            @Valid @RequestBody CreateBimModelRequest request) {
        BimModelResponse response = bimModelService.createModel(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить BIM модель")
    public ResponseEntity<ApiResponse<BimModelResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBimModelRequest request) {
        BimModelResponse response = bimModelService.updateModel(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Импортировать BIM модель")
    public ResponseEntity<ApiResponse<BimModelResponse>> importModel(@PathVariable UUID id) {
        BimModelResponse response = bimModelService.importModel(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/process")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обработать BIM модель")
    public ResponseEntity<ApiResponse<BimModelResponse>> processModel(@PathVariable UUID id) {
        BimModelResponse response = bimModelService.processModel(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить BIM модель")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        bimModelService.deleteModel(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
