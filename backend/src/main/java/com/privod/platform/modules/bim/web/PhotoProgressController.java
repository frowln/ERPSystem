package com.privod.platform.modules.bim.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.bim.service.PhotoProgressService;
import com.privod.platform.modules.bim.web.dto.CreatePhotoProgressRequest;
import com.privod.platform.modules.bim.web.dto.PhotoProgressResponse;
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
@RequestMapping("/api/bim/photos")
@RequiredArgsConstructor
@Tag(name = "Photo Progress", description = "Фотофиксация прогресса строительства")
public class PhotoProgressController {

    private final PhotoProgressService photoProgressService;

    @GetMapping
    @Operation(summary = "Список фото прогресса с фильтрацией по проекту")
    public ResponseEntity<ApiResponse<PageResponse<PhotoProgressResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PhotoProgressResponse> page = photoProgressService.listPhotos(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить фото по ID")
    public ResponseEntity<ApiResponse<PhotoProgressResponse>> getById(@PathVariable UUID id) {
        PhotoProgressResponse response = photoProgressService.getPhoto(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Загрузить фото прогресса")
    public ResponseEntity<ApiResponse<PhotoProgressResponse>> create(
            @Valid @RequestBody CreatePhotoProgressRequest request) {
        PhotoProgressResponse response = photoProgressService.createPhoto(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'FOREMAN')")
    @Operation(summary = "Обновить фото прогресса")
    public ResponseEntity<ApiResponse<PhotoProgressResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreatePhotoProgressRequest request) {
        PhotoProgressResponse response = photoProgressService.updatePhoto(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить фото прогресса")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        photoProgressService.deletePhoto(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
