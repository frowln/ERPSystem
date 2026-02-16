package com.privod.platform.modules.bim.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.bim.service.DesignDrawingService;
import com.privod.platform.modules.bim.web.dto.CreateDesignDrawingRequest;
import com.privod.platform.modules.bim.web.dto.DesignDrawingResponse;
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
@RequestMapping("/api/bim/drawings")
@RequiredArgsConstructor
@Tag(name = "Design Drawings", description = "Управление чертежами")
public class DesignDrawingController {

    private final DesignDrawingService designDrawingService;

    @GetMapping
    @Operation(summary = "Список чертежей с фильтрацией по пакету")
    public ResponseEntity<ApiResponse<PageResponse<DesignDrawingResponse>>> list(
            @RequestParam(required = false) UUID packageId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DesignDrawingResponse> page = designDrawingService.listDrawings(packageId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить чертёж по ID")
    public ResponseEntity<ApiResponse<DesignDrawingResponse>> getById(@PathVariable UUID id) {
        DesignDrawingResponse response = designDrawingService.getDrawing(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать чертёж")
    public ResponseEntity<ApiResponse<DesignDrawingResponse>> create(
            @Valid @RequestBody CreateDesignDrawingRequest request) {
        DesignDrawingResponse response = designDrawingService.createDrawing(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить чертёж")
    public ResponseEntity<ApiResponse<DesignDrawingResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDesignDrawingRequest request) {
        DesignDrawingResponse response = designDrawingService.updateDrawing(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/set-current")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Перевести чертёж в статус 'Действующий'")
    public ResponseEntity<ApiResponse<DesignDrawingResponse>> setCurrent(@PathVariable UUID id) {
        DesignDrawingResponse response = designDrawingService.setCurrentDrawing(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/supersede")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Заместить чертёж")
    public ResponseEntity<ApiResponse<DesignDrawingResponse>> supersede(@PathVariable UUID id) {
        DesignDrawingResponse response = designDrawingService.supersedeDrawing(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить чертёж")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        designDrawingService.deleteDrawing(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
