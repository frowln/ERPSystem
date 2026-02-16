package com.privod.platform.modules.legal.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.legal.domain.CaseStatus;
import com.privod.platform.modules.legal.domain.LegalTemplateType;
import com.privod.platform.modules.legal.service.LegalService;
import com.privod.platform.modules.legal.web.dto.ContractLegalTemplateResponse;
import com.privod.platform.modules.legal.web.dto.CreateLegalCaseRequest;
import com.privod.platform.modules.legal.web.dto.CreateLegalDecisionRequest;
import com.privod.platform.modules.legal.web.dto.CreateLegalRemarkRequest;
import com.privod.platform.modules.legal.web.dto.CreateLegalTemplateRequest;
import com.privod.platform.modules.legal.web.dto.LegalCaseResponse;
import com.privod.platform.modules.legal.web.dto.LegalDashboardResponse;
import com.privod.platform.modules.legal.web.dto.LegalDecisionResponse;
import com.privod.platform.modules.legal.web.dto.LegalRemarkResponse;
import com.privod.platform.modules.legal.web.dto.UpdateLegalCaseRequest;
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
@RequestMapping("/api/v1/legal")
@RequiredArgsConstructor
@Tag(name = "Legal", description = "Legal case management endpoints")
public class LegalController {

    private final LegalService legalService;

    // ===================== Cases =====================

    @GetMapping("/cases")
    @Operation(summary = "List legal cases with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<LegalCaseResponse>>> listCases(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) CaseStatus status,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID lawyerId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<LegalCaseResponse> page = legalService.listCases(search, status, projectId, lawyerId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/cases/{id}")
    @Operation(summary = "Get legal case by ID")
    public ResponseEntity<ApiResponse<LegalCaseResponse>> getCase(@PathVariable UUID id) {
        LegalCaseResponse response = legalService.getCase(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/cases")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new legal case")
    public ResponseEntity<ApiResponse<LegalCaseResponse>> createCase(
            @Valid @RequestBody CreateLegalCaseRequest request) {
        LegalCaseResponse response = legalService.createCase(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/cases/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a legal case")
    public ResponseEntity<ApiResponse<LegalCaseResponse>> updateCase(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateLegalCaseRequest request) {
        LegalCaseResponse response = legalService.updateCase(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/cases/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER')")
    @Operation(summary = "Delete a legal case (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteCase(@PathVariable UUID id) {
        legalService.deleteCase(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/cases/upcoming-hearings")
    @Operation(summary = "Get cases with upcoming hearings within specified days")
    public ResponseEntity<ApiResponse<List<LegalCaseResponse>>> getUpcomingHearings(
            @RequestParam(defaultValue = "30") int days) {
        List<LegalCaseResponse> cases = legalService.getUpcomingHearings(days);
        return ResponseEntity.ok(ApiResponse.ok(cases));
    }

    // ===================== Decisions =====================

    @GetMapping("/cases/{caseId}/decisions")
    @Operation(summary = "Get all decisions for a legal case")
    public ResponseEntity<ApiResponse<List<LegalDecisionResponse>>> getCaseDecisions(
            @PathVariable UUID caseId) {
        List<LegalDecisionResponse> decisions = legalService.getCaseDecisions(caseId);
        return ResponseEntity.ok(ApiResponse.ok(decisions));
    }

    @PostMapping("/decisions")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER')")
    @Operation(summary = "Create a legal decision")
    public ResponseEntity<ApiResponse<LegalDecisionResponse>> createDecision(
            @Valid @RequestBody CreateLegalDecisionRequest request) {
        LegalDecisionResponse response = legalService.createDecision(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/decisions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER')")
    @Operation(summary = "Update a legal decision")
    public ResponseEntity<ApiResponse<LegalDecisionResponse>> updateDecision(
            @PathVariable UUID id,
            @Valid @RequestBody CreateLegalDecisionRequest request) {
        LegalDecisionResponse response = legalService.updateDecision(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/decisions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER')")
    @Operation(summary = "Delete a legal decision (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteDecision(@PathVariable UUID id) {
        legalService.deleteDecision(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ===================== Remarks =====================

    @GetMapping("/cases/{caseId}/remarks")
    @Operation(summary = "Get all remarks for a legal case")
    public ResponseEntity<ApiResponse<List<LegalRemarkResponse>>> getCaseRemarks(
            @PathVariable UUID caseId,
            @RequestParam(defaultValue = "false") boolean includeConfidential) {
        List<LegalRemarkResponse> remarks = legalService.getCaseRemarks(caseId, includeConfidential);
        return ResponseEntity.ok(ApiResponse.ok(remarks));
    }

    @PostMapping("/remarks")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a remark for a legal case")
    public ResponseEntity<ApiResponse<LegalRemarkResponse>> createRemark(
            @Valid @RequestBody CreateLegalRemarkRequest request) {
        LegalRemarkResponse response = legalService.createRemark(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/remarks/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER', 'PROJECT_MANAGER')")
    @Operation(summary = "Update a legal remark")
    public ResponseEntity<ApiResponse<LegalRemarkResponse>> updateRemark(
            @PathVariable UUID id,
            @Valid @RequestBody CreateLegalRemarkRequest request) {
        LegalRemarkResponse response = legalService.updateRemark(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/remarks/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER')")
    @Operation(summary = "Delete a legal remark (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteRemark(@PathVariable UUID id) {
        legalService.deleteRemark(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ===================== Templates =====================

    @GetMapping("/templates")
    @Operation(summary = "List legal templates with filtering")
    public ResponseEntity<ApiResponse<PageResponse<ContractLegalTemplateResponse>>> listTemplates(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) LegalTemplateType type,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {

        Page<ContractLegalTemplateResponse> page = legalService.listTemplates(search, type, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @PostMapping("/templates")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER')")
    @Operation(summary = "Create a new legal template")
    public ResponseEntity<ApiResponse<ContractLegalTemplateResponse>> createTemplate(
            @Valid @RequestBody CreateLegalTemplateRequest request) {
        ContractLegalTemplateResponse response = legalService.createTemplate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER')")
    @Operation(summary = "Update a legal template")
    public ResponseEntity<ApiResponse<ContractLegalTemplateResponse>> updateTemplate(
            @PathVariable UUID id,
            @Valid @RequestBody CreateLegalTemplateRequest request) {
        ContractLegalTemplateResponse response = legalService.updateTemplate(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/templates/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'LAWYER')")
    @Operation(summary = "Delete a legal template (soft delete)")
    public ResponseEntity<ApiResponse<Void>> deleteTemplate(@PathVariable UUID id) {
        legalService.deleteTemplate(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ===================== Dashboard =====================

    @GetMapping("/dashboard")
    @Operation(summary = "Get legal dashboard summary")
    public ResponseEntity<ApiResponse<LegalDashboardResponse>> getDashboard() {
        LegalDashboardResponse response = legalService.getDashboard();
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
