package com.privod.platform.modules.document.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.document.domain.DocumentCategory;
import com.privod.platform.modules.document.domain.DocumentStatus;
import com.privod.platform.modules.document.service.DocumentService;
import com.privod.platform.modules.document.web.dto.AddDocumentCommentRequest;
import com.privod.platform.modules.document.web.dto.ChangeDocumentStatusRequest;
import com.privod.platform.modules.document.web.dto.CreateDocumentRequest;
import com.privod.platform.modules.document.web.dto.DocumentAccessResponse;
import com.privod.platform.modules.document.web.dto.DocumentCommentResponse;
import com.privod.platform.modules.document.web.dto.DocumentResponse;
import com.privod.platform.modules.document.web.dto.GrantAccessRequest;
import com.privod.platform.modules.document.web.dto.UpdateDocumentRequest;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
@Tag(name = "Documents", description = "Document management endpoints")
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping
    @Operation(summary = "List documents with filtering, pagination, and sorting")
    public ResponseEntity<ApiResponse<PageResponse<DocumentResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) DocumentCategory category,
            @RequestParam(required = false) DocumentStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<DocumentResponse> page = documentService.listDocuments(projectId, category, status, search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get document by ID with access info")
    public ResponseEntity<ApiResponse<DocumentResponse>> getById(@PathVariable UUID id) {
        DocumentResponse response = documentService.getDocument(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Create a new document (metadata only)")
    public ResponseEntity<ApiResponse<DocumentResponse>> create(
            @Valid @RequestBody CreateDocumentRequest request) {
        DocumentResponse response = documentService.createDocument(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Update an existing document")
    public ResponseEntity<ApiResponse<DocumentResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDocumentRequest request) {
        DocumentResponse response = documentService.updateDocument(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Change document status")
    public ResponseEntity<ApiResponse<DocumentResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeDocumentStatusRequest request) {
        DocumentResponse response = documentService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/version")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ENGINEER', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Create a new version of the document")
    public ResponseEntity<ApiResponse<DocumentResponse>> createVersion(@PathVariable UUID id) {
        DocumentResponse response = documentService.createVersion(id);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/comments")
    @Operation(summary = "Add a comment to a document")
    public ResponseEntity<ApiResponse<DocumentCommentResponse>> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody AddDocumentCommentRequest request) {
        DocumentCommentResponse response = documentService.addComment(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/access")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Grant access to a document")
    public ResponseEntity<ApiResponse<DocumentAccessResponse>> grantAccess(
            @PathVariable UUID id,
            @Valid @RequestBody GrantAccessRequest request) {
        DocumentAccessResponse response = documentService.grantAccess(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}/access/{userId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Revoke access from a document")
    public ResponseEntity<ApiResponse<Void>> revokeAccess(
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        documentService.revokeAccess(id, userId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get document version history")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getHistory(@PathVariable UUID id) {
        List<DocumentResponse> history = documentService.getDocumentHistory(id);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @GetMapping("/search")
    @Operation(summary = "Search documents by text")
    public ResponseEntity<ApiResponse<PageResponse<DocumentResponse>>> search(
            @RequestParam String query,
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DocumentResponse> page = documentService.searchDocuments(query, projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/expiring")
    @Operation(summary = "Get documents expiring within specified days")
    public ResponseEntity<ApiResponse<List<DocumentResponse>>> getExpiringDocuments(
            @RequestParam(defaultValue = "30") int daysAhead) {
        List<DocumentResponse> expiring = documentService.getExpiringDocuments(daysAhead);
        return ResponseEntity.ok(ApiResponse.ok(expiring));
    }
}
