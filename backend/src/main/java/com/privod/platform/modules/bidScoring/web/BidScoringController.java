package com.privod.platform.modules.bidScoring.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.bidScoring.domain.ComparisonStatus;
import com.privod.platform.modules.bidScoring.service.BidScoringService;
import com.privod.platform.modules.bidScoring.web.dto.BidComparisonResponse;
import com.privod.platform.modules.bidScoring.web.dto.BidCriteriaResponse;
import com.privod.platform.modules.bidScoring.web.dto.BidScoreResponse;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidComparisonRequest;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidCriteriaRequest;
import com.privod.platform.modules.bidScoring.web.dto.CreateBidScoreRequest;
import com.privod.platform.modules.bidScoring.web.dto.UpdateBidComparisonRequest;
import com.privod.platform.modules.bidScoring.web.dto.UpdateBidCriteriaRequest;
import com.privod.platform.modules.bidScoring.web.dto.UpdateBidScoreRequest;
import com.privod.platform.modules.bidScoring.web.dto.VendorTotalScoreResponse;
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
@RequestMapping("/api/bid-scoring")
@RequiredArgsConstructor
@Tag(name = "Bid Scoring", description = "RFQ comparison and bid scoring endpoints")
public class BidScoringController {

    private final BidScoringService bidScoringService;

    // ======================== Root endpoint ========================

    @GetMapping
    @Operation(summary = "List bid comparisons (root endpoint) with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<BidComparisonResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) ComparisonStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<BidComparisonResponse> page = bidScoringService.listComparisons(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    // ======================== BidComparison ========================

    @GetMapping("/comparisons")
    @Operation(summary = "List bid comparisons with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<BidComparisonResponse>>> listComparisons(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) ComparisonStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<BidComparisonResponse> page = bidScoringService.listComparisons(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/comparisons/{id}")
    @Operation(summary = "Get bid comparison by ID")
    public ResponseEntity<ApiResponse<BidComparisonResponse>> getComparison(@PathVariable UUID id) {
        BidComparisonResponse response = bidScoringService.getComparison(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/comparisons")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Create a new bid comparison")
    public ResponseEntity<ApiResponse<BidComparisonResponse>> createComparison(
            @Valid @RequestBody CreateBidComparisonRequest request) {
        BidComparisonResponse response = bidScoringService.createComparison(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/comparisons/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Update an existing bid comparison")
    public ResponseEntity<ApiResponse<BidComparisonResponse>> updateComparison(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBidComparisonRequest request) {
        BidComparisonResponse response = bidScoringService.updateComparison(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/comparisons/{id}/start")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Start a bid comparison (move from DRAFT to IN_PROGRESS)")
    public ResponseEntity<ApiResponse<BidComparisonResponse>> startComparison(@PathVariable UUID id) {
        BidComparisonResponse response = bidScoringService.startComparison(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/comparisons/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Complete a bid comparison, validate weights, determine winner")
    public ResponseEntity<ApiResponse<BidComparisonResponse>> completeComparison(@PathVariable UUID id) {
        BidComparisonResponse response = bidScoringService.completeComparison(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/comparisons/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Approve a completed bid comparison")
    public ResponseEntity<ApiResponse<BidComparisonResponse>> approveComparison(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID approvedById) {
        BidComparisonResponse response = bidScoringService.approveComparison(id, approvedById);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/comparisons/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft delete a bid comparison")
    public ResponseEntity<ApiResponse<Void>> deleteComparison(@PathVariable UUID id) {
        bidScoringService.deleteComparison(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ======================== BidCriteria ========================

    @GetMapping("/comparisons/{comparisonId}/criteria")
    @Operation(summary = "List criteria for a bid comparison")
    public ResponseEntity<ApiResponse<List<BidCriteriaResponse>>> listCriteria(
            @PathVariable UUID comparisonId) {
        List<BidCriteriaResponse> criteria = bidScoringService.listCriteria(comparisonId);
        return ResponseEntity.ok(ApiResponse.ok(criteria));
    }

    @PostMapping("/criteria")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Create a new bid criteria")
    public ResponseEntity<ApiResponse<BidCriteriaResponse>> createCriteria(
            @Valid @RequestBody CreateBidCriteriaRequest request) {
        BidCriteriaResponse response = bidScoringService.createCriteria(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/criteria/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Update an existing bid criteria")
    public ResponseEntity<ApiResponse<BidCriteriaResponse>> updateCriteria(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBidCriteriaRequest request) {
        BidCriteriaResponse response = bidScoringService.updateCriteria(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/criteria/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft delete a bid criteria")
    public ResponseEntity<ApiResponse<Void>> deleteCriteria(@PathVariable UUID id) {
        bidScoringService.deleteCriteria(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // ======================== BidScore ========================

    @GetMapping("/comparisons/{comparisonId}/scores")
    @Operation(summary = "List all scores for a bid comparison")
    public ResponseEntity<ApiResponse<List<BidScoreResponse>>> listScores(
            @PathVariable UUID comparisonId) {
        List<BidScoreResponse> scores = bidScoringService.listScores(comparisonId);
        return ResponseEntity.ok(ApiResponse.ok(scores));
    }

    @GetMapping("/comparisons/{comparisonId}/scores/vendor/{vendorId}")
    @Operation(summary = "Get scores for a specific vendor in a bid comparison")
    public ResponseEntity<ApiResponse<List<BidScoreResponse>>> getVendorScores(
            @PathVariable UUID comparisonId,
            @PathVariable UUID vendorId) {
        List<BidScoreResponse> scores = bidScoringService.getVendorScores(comparisonId, vendorId);
        return ResponseEntity.ok(ApiResponse.ok(scores));
    }

    @PostMapping("/scores")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Create a new bid score")
    public ResponseEntity<ApiResponse<BidScoreResponse>> createScore(
            @Valid @RequestBody CreateBidScoreRequest request) {
        BidScoreResponse response = bidScoringService.createScore(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/scores/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'PROCUREMENT_MANAGER')")
    @Operation(summary = "Update an existing bid score")
    public ResponseEntity<ApiResponse<BidScoreResponse>> updateScore(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBidScoreRequest request) {
        BidScoreResponse response = bidScoringService.updateScore(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/scores/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft delete a bid score")
    public ResponseEntity<ApiResponse<Void>> deleteScore(@PathVariable UUID id) {
        bidScoringService.deleteScore(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/comparisons/{comparisonId}/ranking")
    @Operation(summary = "Get vendor ranking by total weighted score")
    public ResponseEntity<ApiResponse<List<VendorTotalScoreResponse>>> getVendorRanking(
            @PathVariable UUID comparisonId) {
        List<VendorTotalScoreResponse> ranking = bidScoringService.getVendorRanking(comparisonId);
        return ResponseEntity.ok(ApiResponse.ok(ranking));
    }

    @GetMapping("/comparisons/{comparisonId}/winner")
    @Operation(summary = "Determine the winner vendor based on highest weighted score")
    public ResponseEntity<ApiResponse<VendorTotalScoreResponse>> determineWinner(
            @PathVariable UUID comparisonId) {
        VendorTotalScoreResponse winner = bidScoringService.determineWinner(comparisonId);
        return ResponseEntity.ok(ApiResponse.ok(winner));
    }
}
