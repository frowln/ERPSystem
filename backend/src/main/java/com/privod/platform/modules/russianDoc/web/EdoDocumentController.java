package com.privod.platform.modules.russianDoc.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.russianDoc.service.EdoService;
import com.privod.platform.modules.russianDoc.web.dto.CreateEdoTemplateRequest;
import com.privod.platform.modules.russianDoc.web.dto.EdoGeneratedDocumentResponse;
import com.privod.platform.modules.russianDoc.web.dto.EdoTemplateResponse;
import com.privod.platform.modules.russianDoc.web.dto.GenerateEdoDocumentRequest;
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
@RequestMapping("/api/edo-documents")
@RequiredArgsConstructor
@Tag(name = "EDO Documents", description = "Electronic Document Exchange (EDO) generation and management")
public class EdoDocumentController {

    private final EdoService edoService;

    // ============================
    // Templates
    // ============================

    @GetMapping("/templates")
    @Operation(summary = "List EDO templates")
    public ResponseEntity<ApiResponse<PageResponse<EdoTemplateResponse>>> listTemplates(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EdoTemplateResponse> page = edoService.listTemplates(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/templates/{id}")
    @Operation(summary = "Get EDO template by ID")
    public ResponseEntity<ApiResponse<EdoTemplateResponse>> getTemplate(@PathVariable UUID id) {
        EdoTemplateResponse response = edoService.getTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/templates/active")
    @Operation(summary = "Get active EDO templates, optionally filtered by document type")
    public ResponseEntity<ApiResponse<List<EdoTemplateResponse>>> getActiveTemplates(
            @RequestParam(required = false) String documentType) {
        List<EdoTemplateResponse> templates = edoService.getActiveTemplates(documentType);
        return ResponseEntity.ok(ApiResponse.ok(templates));
    }

    @PostMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Create a new EDO template")
    public ResponseEntity<ApiResponse<EdoTemplateResponse>> createTemplate(
            @Valid @RequestBody CreateEdoTemplateRequest request) {
        EdoTemplateResponse response = edoService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Update an EDO template")
    public ResponseEntity<ApiResponse<EdoTemplateResponse>> updateTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody CreateEdoTemplateRequest request) {
        EdoTemplateResponse response = edoService.updateTemplate(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Delete an EDO template (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID id) {
        edoService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ============================
    // Generated Documents
    // ============================

    @GetMapping("/generated")
    @Operation(summary = "List generated EDO documents")
    public ResponseEntity<ApiResponse<PageResponse<EdoGeneratedDocumentResponse>>> listGenerated(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<EdoGeneratedDocumentResponse> page = edoService.listGeneratedDocuments(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'ACCOUNTANT', 'DOCUMENT_MANAGER')")
    @Operation(summary = "Generate an EDO document from template and source document")
    public ResponseEntity<ApiResponse<EdoGeneratedDocumentResponse>> generateDocument(
            @Valid @RequestBody GenerateEdoDocumentRequest request) {
        EdoGeneratedDocumentResponse response = edoService.generateDocument(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/generated/by-source")
    @Operation(summary = "Get generated EDO documents by source document")
    public ResponseEntity<ApiResponse<List<EdoGeneratedDocumentResponse>>> getBySource(
            @RequestParam String sourceDocumentType,
            @RequestParam UUID sourceDocumentId) {
        List<EdoGeneratedDocumentResponse> documents =
                edoService.getDocumentsBySource(sourceDocumentType, sourceDocumentId);
        return ResponseEntity.ok(ApiResponse.ok(documents));
    }
}
