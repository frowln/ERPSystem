package com.privod.platform.modules.constructability.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.constructability.service.ConstructabilityService;
import com.privod.platform.modules.constructability.web.dto.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/constructability-reviews")
@RequiredArgsConstructor
@Tag(name = "Constructability Review", description = "Обзор конструктивности (Constructability Review)")
public class ConstructabilityController {

    private final ConstructabilityService service;

    // ===================== REVIEWS =====================

    @GetMapping
    @Operation(summary = "Список обзоров конструктивности")
    public ResponseEntity<ApiResponse<PageResponse<ConstructabilityReviewResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20) Pageable pageable) {
        Page<ConstructabilityReviewResponse> page = service.listByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить обзор конструктивности по ID")
    public ResponseEntity<ApiResponse<ConstructabilityReviewResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать обзор конструктивности")
    public ResponseEntity<ApiResponse<ConstructabilityReviewResponse>> create(
            @Valid @RequestBody CreateConstructabilityReviewRequest request) {
        ConstructabilityReviewResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить обзор конструктивности")
    public ResponseEntity<ApiResponse<ConstructabilityReviewResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateConstructabilityReviewRequest request) {
        ConstructabilityReviewResponse response = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Удалить обзор конструктивности (soft-delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.deleteReview(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ===================== ITEMS =====================

    @GetMapping("/{id}/items")
    @Operation(summary = "Список элементов обзора")
    public ResponseEntity<ApiResponse<List<ConstructabilityItemResponse>>> listItems(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(service.listItems(id)));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Добавить элемент обзора")
    public ResponseEntity<ApiResponse<ConstructabilityItemResponse>> addItem(
            @PathVariable UUID id,
            @Valid @RequestBody CreateConstructabilityItemRequest request) {
        ConstructabilityItemResponse response = service.addItem(id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить элемент обзора")
    public ResponseEntity<ApiResponse<ConstructabilityItemResponse>> updateItem(
            @PathVariable UUID id,
            @PathVariable UUID itemId,
            @Valid @RequestBody UpdateConstructabilityItemRequest request) {
        ConstructabilityItemResponse response = service.updateItem(id, itemId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Удалить элемент обзора (soft-delete)")
    public ResponseEntity<ApiResponse<Void>> deleteItem(
            @PathVariable UUID id,
            @PathVariable UUID itemId) {
        service.deleteItem(id, itemId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
