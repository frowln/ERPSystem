package com.privod.platform.modules.bim.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.bim.service.PhotoComparisonService;
import com.privod.platform.modules.bim.web.dto.CreatePhotoComparisonRequest;
import com.privod.platform.modules.bim.web.dto.PhotoComparisonResponse;
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
@RequestMapping("/api/bim/photo-comparisons")
@RequiredArgsConstructor
@Tag(name = "Photo Comparisons", description = "Сравнение фото прогресса")
public class PhotoComparisonController {

    private final PhotoComparisonService photoComparisonService;

    @GetMapping
    @Operation(summary = "Список сравнений фото")
    public ResponseEntity<ApiResponse<PageResponse<PhotoComparisonResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PhotoComparisonResponse> page = photoComparisonService.listComparisons(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить сравнение по ID")
    public ResponseEntity<ApiResponse<PhotoComparisonResponse>> getById(@PathVariable UUID id) {
        PhotoComparisonResponse response = photoComparisonService.getComparison(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать сравнение фото")
    public ResponseEntity<ApiResponse<PhotoComparisonResponse>> create(
            @Valid @RequestBody CreatePhotoComparisonRequest request) {
        PhotoComparisonResponse response = photoComparisonService.createComparison(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить сравнение фото")
    public ResponseEntity<ApiResponse<PhotoComparisonResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreatePhotoComparisonRequest request) {
        PhotoComparisonResponse response = photoComparisonService.updateComparison(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить сравнение фото")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        photoComparisonService.deleteComparison(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
