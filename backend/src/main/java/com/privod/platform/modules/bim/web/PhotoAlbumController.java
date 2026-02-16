package com.privod.platform.modules.bim.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.bim.service.PhotoAlbumService;
import com.privod.platform.modules.bim.web.dto.CreatePhotoAlbumRequest;
import com.privod.platform.modules.bim.web.dto.PhotoAlbumResponse;
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
@RequestMapping("/api/bim/albums")
@RequiredArgsConstructor
@Tag(name = "Photo Albums", description = "Управление фотоальбомами")
public class PhotoAlbumController {

    private final PhotoAlbumService photoAlbumService;

    @GetMapping
    @Operation(summary = "Список фотоальбомов")
    public ResponseEntity<ApiResponse<PageResponse<PhotoAlbumResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PhotoAlbumResponse> page = photoAlbumService.listAlbums(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить фотоальбом по ID")
    public ResponseEntity<ApiResponse<PhotoAlbumResponse>> getById(@PathVariable UUID id) {
        PhotoAlbumResponse response = photoAlbumService.getAlbum(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать фотоальбом")
    public ResponseEntity<ApiResponse<PhotoAlbumResponse>> create(
            @Valid @RequestBody CreatePhotoAlbumRequest request) {
        PhotoAlbumResponse response = photoAlbumService.createAlbum(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить фотоальбом")
    public ResponseEntity<ApiResponse<PhotoAlbumResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreatePhotoAlbumRequest request) {
        PhotoAlbumResponse response = photoAlbumService.updateAlbum(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить фотоальбом")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        photoAlbumService.deleteAlbum(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
