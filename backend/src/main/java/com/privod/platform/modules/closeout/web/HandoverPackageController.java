package com.privod.platform.modules.closeout.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.closeout.domain.HandoverStatus;
import com.privod.platform.modules.closeout.service.HandoverPackageService;
import com.privod.platform.modules.closeout.web.dto.CreateHandoverPackageRequest;
import com.privod.platform.modules.closeout.web.dto.HandoverPackageResponse;
import com.privod.platform.modules.closeout.web.dto.UpdateHandoverPackageRequest;
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
@RequestMapping("/api/handover-packages")
@RequiredArgsConstructor
@Tag(name = "Handover Packages", description = "Управление пакетами передачи объекта")
public class HandoverPackageController {

    private final HandoverPackageService handoverService;

    @GetMapping
    @Operation(summary = "Список пакетов передачи с фильтрацией и пагинацией")
    public ResponseEntity<ApiResponse<PageResponse<HandoverPackageResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) HandoverStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<HandoverPackageResponse> page = handoverService.findAll(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить пакет передачи по ID")
    public ResponseEntity<ApiResponse<HandoverPackageResponse>> getById(@PathVariable UUID id) {
        HandoverPackageResponse response = handoverService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Создать пакет передачи")
    public ResponseEntity<ApiResponse<HandoverPackageResponse>> create(
            @Valid @RequestBody CreateHandoverPackageRequest request) {
        HandoverPackageResponse response = handoverService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Обновить пакет передачи")
    public ResponseEntity<ApiResponse<HandoverPackageResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateHandoverPackageRequest request) {
        HandoverPackageResponse response = handoverService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Удалить пакет передачи (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        handoverService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
