package com.privod.platform.modules.bim.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.bim.service.DesignPackageService;
import com.privod.platform.modules.bim.web.dto.CreateDesignPackageRequest;
import com.privod.platform.modules.bim.web.dto.DesignPackageResponse;
import com.privod.platform.modules.bim.web.dto.UpdateDesignPackageRequest;
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
@RequestMapping("/api/bim/design-packages")
@RequiredArgsConstructor
@Tag(name = "Design Packages", description = "Управление проектными пакетами")
public class DesignPackageController {

    private final DesignPackageService designPackageService;

    @GetMapping
    @Operation(summary = "Список проектных пакетов")
    public ResponseEntity<ApiResponse<PageResponse<DesignPackageResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DesignPackageResponse> page = designPackageService.listPackages(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Получить проектный пакет по ID")
    public ResponseEntity<ApiResponse<DesignPackageResponse>> getById(@PathVariable UUID id) {
        DesignPackageResponse response = designPackageService.getPackage(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Создать проектный пакет")
    public ResponseEntity<ApiResponse<DesignPackageResponse>> create(
            @Valid @RequestBody CreateDesignPackageRequest request) {
        DesignPackageResponse response = designPackageService.createPackage(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Обновить проектный пакет")
    public ResponseEntity<ApiResponse<DesignPackageResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDesignPackageRequest request) {
        DesignPackageResponse response = designPackageService.updatePackage(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/submit-review")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER')")
    @Operation(summary = "Отправить пакет на проверку")
    public ResponseEntity<ApiResponse<DesignPackageResponse>> submitForReview(@PathVariable UUID id) {
        DesignPackageResponse response = designPackageService.submitForReview(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Утвердить проектный пакет")
    public ResponseEntity<ApiResponse<DesignPackageResponse>> approve(
            @PathVariable UUID id,
            @RequestParam UUID approvedById) {
        DesignPackageResponse response = designPackageService.approvePackage(id, approvedById);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить проектный пакет")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        designPackageService.deletePackage(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
