package com.privod.platform.modules.contractExt.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.legal.domain.CaseStatus;
import com.privod.platform.modules.contractExt.service.LegalCaseService;
import com.privod.platform.modules.contractExt.web.dto.CreateLegalCaseRequest;
import com.privod.platform.modules.contractExt.web.dto.CreateLegalDocumentRequest;
import com.privod.platform.modules.contractExt.web.dto.LegalCaseResponse;
import com.privod.platform.modules.contractExt.web.dto.LegalDocumentResponse;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/legal-cases")
@RequiredArgsConstructor
@Tag(name = "Legal Cases", description = "Судебные дела")
public class LegalCaseController {

    private final LegalCaseService legalCaseService;

    @GetMapping
    @Operation(summary = "List legal cases by project or contract")
    public ResponseEntity<ApiResponse<PageResponse<LegalCaseResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID contractId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<LegalCaseResponse> page;
        if (contractId != null) {
            page = legalCaseService.listByContract(contractId, pageable);
        } else {
            page = legalCaseService.listByProject(projectId, pageable);
        }
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get legal case by ID")
    public ResponseEntity<ApiResponse<LegalCaseResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(legalCaseService.getById(id)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new legal case")
    public ResponseEntity<ApiResponse<LegalCaseResponse>> create(
            @Valid @RequestBody CreateLegalCaseRequest request) {
        LegalCaseResponse response = legalCaseService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER')")
    @Operation(summary = "Change legal case status")
    public ResponseEntity<ApiResponse<LegalCaseResponse>> changeStatus(
            @PathVariable UUID id,
            @RequestParam CaseStatus status) {
        return ResponseEntity.ok(ApiResponse.ok(legalCaseService.changeStatus(id, status)));
    }

    // -- Documents --

    @GetMapping("/{caseId}/documents")
    @Operation(summary = "List documents for a legal case")
    public ResponseEntity<ApiResponse<List<LegalDocumentResponse>>> listDocuments(@PathVariable UUID caseId) {
        return ResponseEntity.ok(ApiResponse.ok(legalCaseService.listDocuments(caseId)));
    }

    @PostMapping("/{caseId}/documents")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER', 'PROJECT_MANAGER')")
    @Operation(summary = "Upload a document to a legal case")
    public ResponseEntity<ApiResponse<LegalDocumentResponse>> createDocument(
            @PathVariable UUID caseId,
            @Valid @RequestBody CreateLegalDocumentRequest request) {
        LegalDocumentResponse response = legalCaseService.createDocument(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }
}
