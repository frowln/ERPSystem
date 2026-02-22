package com.privod.platform.modules.portal.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.portal.service.PortalKs2DraftService;
import com.privod.platform.modules.portal.web.dto.CreatePortalKs2DraftRequest;
import com.privod.platform.modules.portal.web.dto.PortalKs2DraftResponse;
import com.privod.platform.modules.portal.web.dto.ReviewPortalKs2DraftRequest;
import com.privod.platform.modules.portal.web.dto.UpdatePortalKs2DraftRequest;
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
@RequestMapping("/api/portal/ks2-drafts")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER', 'ADMIN', 'PROJECT_MANAGER')")
@Tag(name = "Portal KS-2 Drafts", description = "Portal KS-2 draft submission endpoints")
public class PortalKs2DraftController {

    private final PortalKs2DraftService portalKs2DraftService;

    @GetMapping
    @Operation(summary = "Get portal user's KS-2 drafts")
    public ResponseEntity<ApiResponse<PageResponse<PortalKs2DraftResponse>>> getMyDrafts(
            @RequestParam UUID portalUserId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PortalKs2DraftResponse> page = portalKs2DraftService.getMyDrafts(portalUserId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Get KS-2 drafts pending review (internal users)")
    public ResponseEntity<ApiResponse<PageResponse<PortalKs2DraftResponse>>> getDraftsForReview(
            @PageableDefault(size = 20, sort = "submittedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PortalKs2DraftResponse> page = portalKs2DraftService.getDraftsForReview(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get KS-2 draft by ID")
    public ResponseEntity<ApiResponse<PortalKs2DraftResponse>> getById(@PathVariable UUID id) {
        PortalKs2DraftResponse response = portalKs2DraftService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @Operation(summary = "Create a new KS-2 draft")
    public ResponseEntity<ApiResponse<PortalKs2DraftResponse>> create(
            @RequestParam UUID portalUserId,
            @Valid @RequestBody CreatePortalKs2DraftRequest request) {
        PortalKs2DraftResponse response = portalKs2DraftService.create(request, portalUserId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update a KS-2 draft (only if DRAFT status)")
    public ResponseEntity<ApiResponse<PortalKs2DraftResponse>> update(
            @PathVariable UUID id,
            @RequestParam UUID portalUserId,
            @Valid @RequestBody UpdatePortalKs2DraftRequest request) {
        PortalKs2DraftResponse response = portalKs2DraftService.update(id, request, portalUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/submit")
    @Operation(summary = "Submit a KS-2 draft for review")
    public ResponseEntity<ApiResponse<PortalKs2DraftResponse>> submit(
            @PathVariable UUID id,
            @RequestParam UUID portalUserId) {
        PortalKs2DraftResponse response = portalKs2DraftService.submit(id, portalUserId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Approve or reject a KS-2 draft (internal users only)")
    public ResponseEntity<ApiResponse<PortalKs2DraftResponse>> review(
            @PathVariable UUID id,
            @Valid @RequestBody ReviewPortalKs2DraftRequest request) {
        PortalKs2DraftResponse response = portalKs2DraftService.review(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Soft delete a KS-2 draft (only if DRAFT status)")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id,
            @RequestParam UUID portalUserId) {
        portalKs2DraftService.delete(id, portalUserId);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
