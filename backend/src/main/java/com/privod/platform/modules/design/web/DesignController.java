package com.privod.platform.modules.design.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.design.domain.DesignReviewStatus;
import com.privod.platform.modules.design.domain.DesignVersionStatus;
import com.privod.platform.modules.design.service.DesignService;
import com.privod.platform.modules.design.web.dto.CreateDesignReviewRequest;
import com.privod.platform.modules.design.web.dto.CreateDesignSectionRequest;
import com.privod.platform.modules.design.web.dto.CreateDesignVersionRequest;
import com.privod.platform.modules.design.web.dto.DesignReviewResponse;
import com.privod.platform.modules.design.web.dto.DesignSectionResponse;
import com.privod.platform.modules.design.web.dto.DesignVersionResponse;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/design")
@RequiredArgsConstructor
@Tag(name = "Проектирование", description = "Управление проектной документацией, рецензиями и разделами")
public class DesignController {

    private final DesignService designService;

    // ========================================================================
    // Design Versions
    // ========================================================================

    @GetMapping("/versions")
    @Operation(summary = "Список версий проектной документации")
    public ResponseEntity<ApiResponse<PageResponse<DesignVersionResponse>>> listVersions(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) DesignVersionStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DesignVersionResponse> page = designService.listVersions(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/versions/{id}")
    @Operation(summary = "Получить версию проектной документации по ID")
    public ResponseEntity<ApiResponse<DesignVersionResponse>> getVersion(@PathVariable UUID id) {
        DesignVersionResponse response = designService.getVersion(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/versions/by-document/{documentId}")
    @Operation(summary = "Получить все версии документа")
    public ResponseEntity<ApiResponse<List<DesignVersionResponse>>> getVersionsByDocument(
            @PathVariable UUID documentId) {
        List<DesignVersionResponse> versions = designService.getVersionsByDocument(documentId);
        return ResponseEntity.ok(ApiResponse.ok(versions));
    }

    @PostMapping("/versions")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DESIGNER')")
    @Operation(summary = "Создать версию проектной документации")
    public ResponseEntity<ApiResponse<DesignVersionResponse>> createVersion(
            @Valid @RequestBody CreateDesignVersionRequest request) {
        DesignVersionResponse response = designService.createVersion(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/versions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DESIGNER')")
    @Operation(summary = "Обновить версию проектной документации")
    public ResponseEntity<ApiResponse<DesignVersionResponse>> updateVersion(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDesignVersionRequest request) {
        DesignVersionResponse response = designService.updateVersion(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/versions/{id}/submit-for-review")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DESIGNER')")
    @Operation(summary = "Отправить версию на рассмотрение")
    public ResponseEntity<ApiResponse<DesignVersionResponse>> submitForReview(@PathVariable UUID id) {
        DesignVersionResponse response = designService.transitionVersionStatus(id, DesignVersionStatus.IN_REVIEW);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/versions/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Утвердить версию проектной документации")
    public ResponseEntity<ApiResponse<DesignVersionResponse>> approveVersion(@PathVariable UUID id) {
        DesignVersionResponse response = designService.transitionVersionStatus(id, DesignVersionStatus.APPROVED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/versions/{id}/supersede")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Пометить версию как замещённую")
    public ResponseEntity<ApiResponse<DesignVersionResponse>> supersedeVersion(@PathVariable UUID id) {
        DesignVersionResponse response = designService.transitionVersionStatus(id, DesignVersionStatus.SUPERSEDED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/versions/{id}/archive")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Архивировать версию проектной документации")
    public ResponseEntity<ApiResponse<DesignVersionResponse>> archiveVersion(@PathVariable UUID id) {
        DesignVersionResponse response = designService.transitionVersionStatus(id, DesignVersionStatus.ARCHIVED);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/versions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить версию проектной документации (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> deleteVersion(@PathVariable UUID id) {
        designService.deleteVersion(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ========================================================================
    // Design Reviews
    // ========================================================================

    @GetMapping("/reviews")
    @Operation(summary = "Список рецензий")
    public ResponseEntity<ApiResponse<PageResponse<DesignReviewResponse>>> listReviews(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DesignReviewResponse> page = designService.listReviews(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/versions/{versionId}/reviews")
    @Operation(summary = "Список рецензий для версии документа")
    public ResponseEntity<ApiResponse<List<DesignReviewResponse>>> getReviewsForVersion(
            @PathVariable UUID versionId) {
        List<DesignReviewResponse> reviews = designService.getReviewsForVersion(versionId);
        return ResponseEntity.ok(ApiResponse.ok(reviews));
    }

    @PostMapping("/reviews")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DESIGNER', 'INSPECTOR')")
    @Operation(summary = "Создать рецензию")
    public ResponseEntity<ApiResponse<DesignReviewResponse>> createReview(
            @Valid @RequestBody CreateDesignReviewRequest request) {
        DesignReviewResponse response = designService.createReview(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PostMapping("/reviews/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'INSPECTOR')")
    @Operation(summary = "Утвердить рецензию")
    public ResponseEntity<ApiResponse<DesignReviewResponse>> approveReview(
            @PathVariable UUID id,
            @RequestParam(required = false) String comments) {
        DesignReviewResponse response = designService.completeReview(id, DesignReviewStatus.APPROVED, comments);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/reviews/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'INSPECTOR')")
    @Operation(summary = "Отклонить рецензию")
    public ResponseEntity<ApiResponse<DesignReviewResponse>> rejectReview(
            @PathVariable UUID id,
            @RequestParam(required = false) String comments) {
        DesignReviewResponse response = designService.completeReview(id, DesignReviewStatus.REJECTED, comments);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/reviews/{id}/request-revision")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'INSPECTOR')")
    @Operation(summary = "Запросить доработку")
    public ResponseEntity<ApiResponse<DesignReviewResponse>> requestRevision(
            @PathVariable UUID id,
            @RequestParam(required = false) String comments) {
        DesignReviewResponse response = designService.completeReview(id, DesignReviewStatus.REVISION_REQUESTED, comments);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ========================================================================
    // Design Sections
    // ========================================================================

    @GetMapping("/sections")
    @Operation(summary = "Список разделов проекта")
    public ResponseEntity<ApiResponse<List<DesignSectionResponse>>> getSections(
            @RequestParam UUID projectId) {
        List<DesignSectionResponse> sections = designService.getSectionsForProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(sections));
    }

    @GetMapping("/sections/root")
    @Operation(summary = "Список корневых разделов проекта")
    public ResponseEntity<ApiResponse<List<DesignSectionResponse>>> getRootSections(
            @RequestParam UUID projectId) {
        List<DesignSectionResponse> sections = designService.getRootSectionsForProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(sections));
    }

    @GetMapping("/sections/{parentId}/children")
    @Operation(summary = "Список дочерних разделов")
    public ResponseEntity<ApiResponse<List<DesignSectionResponse>>> getChildSections(
            @PathVariable UUID parentId) {
        List<DesignSectionResponse> sections = designService.getChildSections(parentId);
        return ResponseEntity.ok(ApiResponse.ok(sections));
    }

    @PostMapping("/sections")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DESIGNER')")
    @Operation(summary = "Создать раздел проекта")
    public ResponseEntity<ApiResponse<DesignSectionResponse>> createSection(
            @Valid @RequestBody CreateDesignSectionRequest request) {
        DesignSectionResponse response = designService.createSection(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/sections/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DESIGNER')")
    @Operation(summary = "Обновить раздел проекта")
    public ResponseEntity<ApiResponse<DesignSectionResponse>> updateSection(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDesignSectionRequest request) {
        DesignSectionResponse response = designService.updateSection(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/sections/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Удалить раздел проекта (мягкое удаление)")
    public ResponseEntity<ApiResponse<Void>> deleteSection(@PathVariable UUID id) {
        designService.deleteSection(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
