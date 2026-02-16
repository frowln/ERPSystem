package com.privod.platform.modules.portal.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.portal.service.PortalProjectService;
import com.privod.platform.modules.portal.web.dto.PortalDocumentResponse;
import com.privod.platform.modules.portal.web.dto.PortalProjectResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/portal/projects")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER')")
@Tag(name = "Portal Projects", description = "Portal project access endpoints")
public class PortalProjectController {

    private final PortalProjectService portalProjectService;

    @GetMapping
    @Operation(summary = "Get projects accessible to the portal user")
    public ResponseEntity<ApiResponse<PageResponse<PortalProjectResponse>>> getMyProjects(
            @RequestParam UUID portalUserId,
            @PageableDefault(size = 20, sort = "grantedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PortalProjectResponse> page = portalProjectService.getMyProjects(portalUserId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{projectId}")
    @Operation(summary = "Get project details for portal user")
    public ResponseEntity<ApiResponse<PortalProjectResponse>> getProjectDetails(
            @RequestParam UUID portalUserId,
            @PathVariable UUID projectId) {
        PortalProjectResponse response = portalProjectService.getProjectDetails(portalUserId, projectId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{projectId}/documents")
    @Operation(summary = "Get shared documents for a project")
    public ResponseEntity<ApiResponse<List<PortalDocumentResponse>>> getProjectDocuments(
            @RequestParam UUID portalUserId,
            @PathVariable UUID projectId) {
        List<PortalDocumentResponse> documents = portalProjectService.getProjectDocuments(portalUserId, projectId);
        return ResponseEntity.ok(ApiResponse.ok(documents));
    }
}
