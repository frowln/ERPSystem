package com.privod.platform.modules.portal.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.portal.service.PortalDocumentService;
import com.privod.platform.modules.portal.web.dto.PortalDocumentResponse;
import com.privod.platform.modules.portal.web.dto.ShareDocumentRequest;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/portal/documents")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('PORTAL_CUSTOMER', 'PORTAL_CONTRACTOR', 'PORTAL_SUBCONTRACTOR', 'PORTAL_SUPPLIER')")
@Tag(name = "Portal Documents", description = "Portal document access endpoints")
public class PortalDocumentController {

    private final PortalDocumentService portalDocumentService;

    @GetMapping
    @Operation(summary = "Get documents shared with portal user")
    public ResponseEntity<ApiResponse<PageResponse<PortalDocumentResponse>>> getSharedDocuments(
            @RequestParam UUID portalUserId,
            @PageableDefault(size = 20, sort = "sharedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<PortalDocumentResponse> page = portalDocumentService.getSharedDocuments(portalUserId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/{documentId}/download")
    @Operation(summary = "Download a shared document (increments counter)")
    public ResponseEntity<ApiResponse<PortalDocumentResponse>> download(
            @RequestParam UUID portalUserId,
            @PathVariable UUID documentId) {
        PortalDocumentResponse response = portalDocumentService.download(portalUserId, documentId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/share")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Share a document with a portal user")
    public ResponseEntity<ApiResponse<PortalDocumentResponse>> shareDocument(
            @Valid @RequestBody ShareDocumentRequest request) {
        PortalDocumentResponse response = portalDocumentService.shareDocument(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }
}
