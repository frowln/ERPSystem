package com.privod.platform.modules.bim.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.bim.service.DrawingAnnotationService;
import com.privod.platform.modules.bim.web.dto.CreateDrawingAnnotationRequest;
import com.privod.platform.modules.bim.web.dto.DrawingAnnotationResponse;
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
@RequestMapping("/api/bim/annotations")
@RequiredArgsConstructor
@Tag(name = "Drawing Annotations", description = "Управление аннотациями на чертежах")
public class DrawingAnnotationController {

    private final DrawingAnnotationService drawingAnnotationService;

    @GetMapping
    @Operation(summary = "Список аннотаций с фильтрацией по чертежу")
    public ResponseEntity<ApiResponse<PageResponse<DrawingAnnotationResponse>>> list(
            @RequestParam(required = false) UUID drawingId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DrawingAnnotationResponse> page = drawingAnnotationService.listAnnotations(drawingId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить аннотацию по ID")
    public ResponseEntity<ApiResponse<DrawingAnnotationResponse>> getById(@PathVariable UUID id) {
        DrawingAnnotationResponse response = drawingAnnotationService.getAnnotation(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать аннотацию на чертеже")
    public ResponseEntity<ApiResponse<DrawingAnnotationResponse>> create(
            @Valid @RequestBody CreateDrawingAnnotationRequest request) {
        DrawingAnnotationResponse response = drawingAnnotationService.createAnnotation(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить аннотацию на чертеже")
    public ResponseEntity<ApiResponse<DrawingAnnotationResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDrawingAnnotationRequest request) {
        DrawingAnnotationResponse response = drawingAnnotationService.updateAnnotation(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Решить аннотацию")
    public ResponseEntity<ApiResponse<DrawingAnnotationResponse>> resolve(
            @PathVariable UUID id,
            @RequestParam UUID resolvedById) {
        DrawingAnnotationResponse response = drawingAnnotationService.resolveAnnotation(id, resolvedById);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить аннотацию")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        drawingAnnotationService.deleteAnnotation(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
