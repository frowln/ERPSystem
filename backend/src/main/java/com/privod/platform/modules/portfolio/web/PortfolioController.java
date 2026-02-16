package com.privod.platform.modules.portfolio.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.portfolio.domain.BidStatus;
import com.privod.platform.modules.portfolio.domain.ClientType;
import com.privod.platform.modules.portfolio.domain.OpportunityStage;
import com.privod.platform.modules.portfolio.domain.PrequalificationStatus;
import com.privod.platform.modules.portfolio.service.PortfolioService;
import com.privod.platform.modules.portfolio.web.dto.BidPackageResponse;
import com.privod.platform.modules.portfolio.web.dto.ChangeOpportunityStageRequest;
import com.privod.platform.modules.portfolio.web.dto.CreateBidPackageRequest;
import com.privod.platform.modules.portfolio.web.dto.CreateOpportunityRequest;
import com.privod.platform.modules.portfolio.web.dto.CreatePrequalificationRequest;
import com.privod.platform.modules.portfolio.web.dto.CreateTenderSubmissionRequest;
import com.privod.platform.modules.portfolio.web.dto.OpportunityResponse;
import com.privod.platform.modules.portfolio.web.dto.PortfolioDashboardResponse;
import com.privod.platform.modules.portfolio.web.dto.PrequalificationResponse;
import com.privod.platform.modules.portfolio.web.dto.TenderSubmissionResponse;
import com.privod.platform.modules.portfolio.web.dto.UpdateBidPackageRequest;
import com.privod.platform.modules.portfolio.web.dto.UpdateOpportunityRequest;
import com.privod.platform.modules.portfolio.web.dto.UpdatePrequalificationRequest;
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
@RequestMapping("/api/portfolio")
@RequiredArgsConstructor
@Tag(name = "Portfolio & CRM", description = "Portfolio management, opportunities, bids, and prequalifications")
public class PortfolioController {

    private final PortfolioService portfolioService;

    // ======================== Root endpoint ========================

    @GetMapping
    @Operation(summary = "List all opportunities (root portfolio endpoint) with filtering, pagination, and sorting")
    public ResponseEntity<ApiResponse<PageResponse<OpportunityResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OpportunityStage stage,
            @RequestParam(required = false) ClientType clientType,
            @RequestParam(required = false) UUID organizationId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<OpportunityResponse> page = portfolioService.listOpportunities(
                search, stage, clientType, organizationId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ======================== Opportunities ========================

    @GetMapping("/opportunities")
    @Operation(summary = "List opportunities with filtering, pagination, and sorting")
    public ResponseEntity<ApiResponse<PageResponse<OpportunityResponse>>> listOpportunities(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) OpportunityStage stage,
            @RequestParam(required = false) ClientType clientType,
            @RequestParam(required = false) UUID organizationId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<OpportunityResponse> page = portfolioService.listOpportunities(
                search, stage, clientType, organizationId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/opportunities/{id}")
    @Operation(summary = "Get opportunity by ID")
    public ResponseEntity<ApiResponse<OpportunityResponse>> getOpportunity(@PathVariable UUID id) {
        OpportunityResponse response = portfolioService.getOpportunity(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/opportunities")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER')")
    @Operation(summary = "Create a new opportunity")
    public ResponseEntity<ApiResponse<OpportunityResponse>> createOpportunity(
            @Valid @RequestBody CreateOpportunityRequest request) {
        OpportunityResponse response = portfolioService.createOpportunity(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/opportunities/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER')")
    @Operation(summary = "Update an existing opportunity")
    public ResponseEntity<ApiResponse<OpportunityResponse>> updateOpportunity(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateOpportunityRequest request) {
        OpportunityResponse response = portfolioService.updateOpportunity(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/opportunities/{id}/stage")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SALES_MANAGER')")
    @Operation(summary = "Change opportunity pipeline stage")
    public ResponseEntity<ApiResponse<OpportunityResponse>> changeStage(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeOpportunityStageRequest request) {
        OpportunityResponse response = portfolioService.changeStage(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/opportunities/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft delete an opportunity")
    public ResponseEntity<ApiResponse<Void>> deleteOpportunity(@PathVariable UUID id) {
        portfolioService.deleteOpportunity(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/dashboard")
    @Operation(summary = "Get portfolio dashboard summary statistics")
    public ResponseEntity<ApiResponse<PortfolioDashboardResponse>> getDashboard(
            @RequestParam(required = false) UUID organizationId) {
        PortfolioDashboardResponse response = portfolioService.getDashboard(organizationId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    // ======================== Bid Packages ========================

    @GetMapping("/bid-packages")
    @Operation(summary = "List bid packages with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<BidPackageResponse>>> listBidPackages(
            @RequestParam(required = false) UUID opportunityId,
            @RequestParam(required = false) BidStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<BidPackageResponse> page = portfolioService.listBidPackages(opportunityId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/bid-packages/{id}")
    @Operation(summary = "Get bid package by ID")
    public ResponseEntity<ApiResponse<BidPackageResponse>> getBidPackage(@PathVariable UUID id) {
        BidPackageResponse response = portfolioService.getBidPackage(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/bid-packages")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'BID_MANAGER')")
    @Operation(summary = "Create a new bid package")
    public ResponseEntity<ApiResponse<BidPackageResponse>> createBidPackage(
            @Valid @RequestBody CreateBidPackageRequest request) {
        BidPackageResponse response = portfolioService.createBidPackage(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/bid-packages/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'BID_MANAGER')")
    @Operation(summary = "Update an existing bid package")
    public ResponseEntity<ApiResponse<BidPackageResponse>> updateBidPackage(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBidPackageRequest request) {
        BidPackageResponse response = portfolioService.updateBidPackage(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/bid-packages/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft delete a bid package")
    public ResponseEntity<ApiResponse<Void>> deleteBidPackage(@PathVariable UUID id) {
        portfolioService.deleteBidPackage(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ======================== Prequalifications ========================

    @GetMapping("/prequalifications")
    @Operation(summary = "List prequalifications with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<PrequalificationResponse>>> listPrequalifications(
            @RequestParam(required = false) UUID organizationId,
            @RequestParam(required = false) PrequalificationStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<PrequalificationResponse> page = portfolioService.listPrequalifications(
                organizationId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/prequalifications/{id}")
    @Operation(summary = "Get prequalification by ID")
    public ResponseEntity<ApiResponse<PrequalificationResponse>> getPrequalification(@PathVariable UUID id) {
        PrequalificationResponse response = portfolioService.getPrequalification(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/prequalifications")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'BID_MANAGER')")
    @Operation(summary = "Create a new prequalification")
    public ResponseEntity<ApiResponse<PrequalificationResponse>> createPrequalification(
            @Valid @RequestBody CreatePrequalificationRequest request) {
        PrequalificationResponse response = portfolioService.createPrequalification(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/prequalifications/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'BID_MANAGER')")
    @Operation(summary = "Update an existing prequalification")
    public ResponseEntity<ApiResponse<PrequalificationResponse>> updatePrequalification(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePrequalificationRequest request) {
        PrequalificationResponse response = portfolioService.updatePrequalification(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/prequalifications/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft delete a prequalification")
    public ResponseEntity<ApiResponse<Void>> deletePrequalification(@PathVariable UUID id) {
        portfolioService.deletePrequalification(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ======================== Tender Submissions ========================

    @GetMapping("/tender-submissions")
    @Operation(summary = "List tender submissions for a bid package")
    public ResponseEntity<ApiResponse<PageResponse<TenderSubmissionResponse>>> listTenderSubmissions(
            @RequestParam UUID bidPackageId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<TenderSubmissionResponse> page = portfolioService.listTenderSubmissions(bidPackageId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/tender-submissions/{id}")
    @Operation(summary = "Get tender submission by ID")
    public ResponseEntity<ApiResponse<TenderSubmissionResponse>> getTenderSubmission(@PathVariable UUID id) {
        TenderSubmissionResponse response = portfolioService.getTenderSubmission(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/tender-submissions")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'BID_MANAGER')")
    @Operation(summary = "Create a new tender submission")
    public ResponseEntity<ApiResponse<TenderSubmissionResponse>> createTenderSubmission(
            @Valid @RequestBody CreateTenderSubmissionRequest request) {
        TenderSubmissionResponse response = portfolioService.createTenderSubmission(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/tender-submissions/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft delete a tender submission")
    public ResponseEntity<ApiResponse<Void>> deleteTenderSubmission(@PathVariable UUID id) {
        portfolioService.deleteTenderSubmission(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
