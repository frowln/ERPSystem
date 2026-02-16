package com.privod.platform.modules.taxRisk.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.taxRisk.domain.AssessmentStatus;
import com.privod.platform.modules.taxRisk.domain.RiskLevel;
import com.privod.platform.modules.taxRisk.service.TaxRiskService;
import com.privod.platform.modules.taxRisk.web.dto.CreateTaxRiskAssessmentRequest;
import com.privod.platform.modules.taxRisk.web.dto.CreateTaxRiskFactorRequest;
import com.privod.platform.modules.taxRisk.web.dto.CreateTaxRiskMitigationRequest;
import com.privod.platform.modules.taxRisk.web.dto.TaxRiskAssessmentResponse;
import com.privod.platform.modules.taxRisk.web.dto.TaxRiskFactorResponse;
import com.privod.platform.modules.taxRisk.web.dto.TaxRiskMitigationResponse;
import com.privod.platform.modules.taxRisk.web.dto.UpdateTaxRiskAssessmentRequest;
import com.privod.platform.modules.taxRisk.web.dto.UpdateTaxRiskFactorRequest;
import com.privod.platform.modules.taxRisk.web.dto.UpdateTaxRiskMitigationRequest;
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
@RequestMapping("/api/tax-risk")
@RequiredArgsConstructor
@Tag(name = "Tax Risk Assessment", description = "Tax risk assessment management endpoints")
public class TaxRiskController {

    private final TaxRiskService taxRiskService;

    // ---- Assessment endpoints ----

    @GetMapping("/assessments")
    @Operation(summary = "List tax risk assessments with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<TaxRiskAssessmentResponse>>> listAssessments(
            @RequestParam(required = false) AssessmentStatus status,
            @RequestParam(required = false) RiskLevel riskLevel,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<TaxRiskAssessmentResponse> page = taxRiskService.listAssessments(status, riskLevel, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/assessments/{id}")
    @Operation(summary = "Get tax risk assessment by ID")
    public ResponseEntity<ApiResponse<TaxRiskAssessmentResponse>> getAssessment(@PathVariable UUID id) {
        TaxRiskAssessmentResponse response = taxRiskService.getAssessment(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/assessments")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Create a new tax risk assessment")
    public ResponseEntity<ApiResponse<TaxRiskAssessmentResponse>> createAssessment(
            @Valid @RequestBody CreateTaxRiskAssessmentRequest request) {
        TaxRiskAssessmentResponse response = taxRiskService.createAssessment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/assessments/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Update an existing tax risk assessment")
    public ResponseEntity<ApiResponse<TaxRiskAssessmentResponse>> updateAssessment(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTaxRiskAssessmentRequest request) {
        TaxRiskAssessmentResponse response = taxRiskService.updateAssessment(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/assessments/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Soft-delete a tax risk assessment")
    public ResponseEntity<ApiResponse<Void>> deleteAssessment(@PathVariable UUID id) {
        taxRiskService.deleteAssessment(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/assessments/by-project/{projectId}")
    @Operation(summary = "Get tax risk assessments by project")
    public ResponseEntity<ApiResponse<List<TaxRiskAssessmentResponse>>> getByProject(
            @PathVariable UUID projectId) {
        List<TaxRiskAssessmentResponse> responses = taxRiskService.getByProject(projectId);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @GetMapping("/assessments/by-organization/{organizationId}")
    @Operation(summary = "Get tax risk assessments by organization")
    public ResponseEntity<ApiResponse<List<TaxRiskAssessmentResponse>>> getByOrganization(
            @PathVariable UUID organizationId) {
        List<TaxRiskAssessmentResponse> responses = taxRiskService.getByOrganization(organizationId);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    // ---- Factor endpoints ----

    @GetMapping("/assessments/{id}/factors")
    @Operation(summary = "List risk factors for an assessment")
    public ResponseEntity<ApiResponse<List<TaxRiskFactorResponse>>> listFactors(
            @PathVariable UUID id) {
        List<TaxRiskFactorResponse> responses = taxRiskService.listFactors(id);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @PostMapping("/assessments/{id}/factors")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Add a risk factor to an assessment")
    public ResponseEntity<ApiResponse<TaxRiskFactorResponse>> addFactor(
            @PathVariable UUID id,
            @Valid @RequestBody CreateTaxRiskFactorRequest request) {
        TaxRiskFactorResponse response = taxRiskService.addFactor(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/assessments/{id}/factors/{factorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Update a risk factor")
    public ResponseEntity<ApiResponse<TaxRiskFactorResponse>> updateFactor(
            @PathVariable UUID id,
            @PathVariable UUID factorId,
            @Valid @RequestBody UpdateTaxRiskFactorRequest request) {
        TaxRiskFactorResponse response = taxRiskService.updateFactor(id, factorId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/assessments/{id}/factors/{factorId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Soft-delete a risk factor")
    public ResponseEntity<ApiResponse<Void>> deleteFactor(
            @PathVariable UUID id,
            @PathVariable UUID factorId) {
        taxRiskService.deleteFactor(id, factorId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Mitigation endpoints ----

    @GetMapping("/assessments/{id}/mitigations")
    @Operation(summary = "List mitigations for an assessment")
    public ResponseEntity<ApiResponse<List<TaxRiskMitigationResponse>>> listMitigations(
            @PathVariable UUID id) {
        List<TaxRiskMitigationResponse> responses = taxRiskService.listMitigations(id);
        return ResponseEntity.ok(ApiResponse.ok(responses));
    }

    @PostMapping("/assessments/{id}/mitigations")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Add a mitigation action to an assessment")
    public ResponseEntity<ApiResponse<TaxRiskMitigationResponse>> addMitigation(
            @PathVariable UUID id,
            @Valid @RequestBody CreateTaxRiskMitigationRequest request) {
        TaxRiskMitigationResponse response = taxRiskService.addMitigation(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/assessments/{id}/mitigations/{mitigationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Update a mitigation action")
    public ResponseEntity<ApiResponse<TaxRiskMitigationResponse>> updateMitigation(
            @PathVariable UUID id,
            @PathVariable UUID mitigationId,
            @Valid @RequestBody UpdateTaxRiskMitigationRequest request) {
        TaxRiskMitigationResponse response = taxRiskService.updateMitigation(id, mitigationId, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/assessments/{id}/mitigations/{mitigationId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Soft-delete a mitigation action")
    public ResponseEntity<ApiResponse<Void>> deleteMitigation(
            @PathVariable UUID id,
            @PathVariable UUID mitigationId) {
        taxRiskService.deleteMitigation(id, mitigationId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ---- Score calculation endpoint ----

    @PostMapping("/assessments/{id}/calculate-score")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Calculate overall risk score based on weighted factors")
    public ResponseEntity<ApiResponse<TaxRiskAssessmentResponse>> calculateScore(
            @PathVariable UUID id) {
        TaxRiskAssessmentResponse response = taxRiskService.calculateOverallScore(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
