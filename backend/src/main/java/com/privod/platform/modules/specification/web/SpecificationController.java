package com.privod.platform.modules.specification.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.specification.domain.SpecificationStatus;
import com.privod.platform.modules.specification.service.SpecificationService;
import com.privod.platform.modules.specification.web.dto.ChangeSpecStatusRequest;
import com.privod.platform.modules.specification.web.dto.CreateSpecItemRequest;
import com.privod.platform.modules.specification.web.dto.CreateSpecificationRequest;
import com.privod.platform.modules.specification.web.dto.SpecItemResponse;
import com.privod.platform.modules.specification.web.dto.SpecificationListResponse;
import com.privod.platform.modules.specification.web.dto.SpecificationResponse;
import com.privod.platform.modules.specification.web.dto.SpecificationSummaryResponse;
import com.privod.platform.modules.specification.web.dto.UpdateSpecItemRequest;
import com.privod.platform.modules.specification.web.dto.UpdateSpecificationRequest;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/specifications")
@RequiredArgsConstructor
@Tag(name = "Specifications", description = "Управление спецификациями")
public class SpecificationController {

    private final SpecificationService specificationService;

    @GetMapping
    @Operation(summary = "Список спецификаций с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<SpecificationListResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) SpecificationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<SpecificationListResponse> page = specificationService.listSpecifications(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить спецификацию по ID с позициями")
    public ResponseEntity<ApiResponse<SpecificationResponse>> getById(@PathVariable UUID id) {
        SpecificationResponse response = specificationService.getSpecification(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать новую спецификацию")
    public ResponseEntity<ApiResponse<SpecificationResponse>> create(
            @Valid @RequestBody CreateSpecificationRequest request) {
        SpecificationResponse response = specificationService.createSpecification(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить спецификацию")
    public ResponseEntity<ApiResponse<SpecificationResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSpecificationRequest request) {
        SpecificationResponse response = specificationService.updateSpecification(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Изменить статус спецификации")
    public ResponseEntity<ApiResponse<SpecificationResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeSpecStatusRequest request) {
        SpecificationResponse response = specificationService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/version")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать новую версию спецификации")
    public ResponseEntity<ApiResponse<SpecificationResponse>> createVersion(@PathVariable UUID id) {
        SpecificationResponse response = specificationService.createVersion(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/items")
    @Operation(summary = "Получить позиции спецификации")
    public ResponseEntity<ApiResponse<List<SpecItemResponse>>> getItems(@PathVariable UUID id) {
        List<SpecItemResponse> items = specificationService.getItems(id);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить позицию в спецификацию")
    public ResponseEntity<ApiResponse<SpecItemResponse>> addItem(
            @PathVariable UUID id,
            @Valid @RequestBody CreateSpecItemRequest request) {
        SpecItemResponse response = specificationService.addItem(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить позицию спецификации")
    public ResponseEntity<ApiResponse<SpecItemResponse>> updateItem(
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateSpecItemRequest request) {
        SpecItemResponse response = specificationService.updateItem(itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Удалить позицию спецификации")
    public ResponseEntity<ApiResponse<Void>> removeItem(@PathVariable UUID itemId) {
        specificationService.removeItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/{id}/summary")
    @Operation(summary = "Сводка по позициям спецификации")
    public ResponseEntity<ApiResponse<SpecificationSummaryResponse>> getSummary(@PathVariable UUID id) {
        SpecificationSummaryResponse response = specificationService.getItemsSummary(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
