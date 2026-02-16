package com.privod.platform.modules.revenueRecognition.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.revenueRecognition.service.RevenueAdjustmentService;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRevenueAdjustmentRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueAdjustmentResponse;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/revenue-adjustments")
@RequiredArgsConstructor
@Tag(name = "Revenue Adjustments", description = "Revenue adjustment management for recognition periods")
public class RevenueAdjustmentController {

    private final RevenueAdjustmentService adjustmentService;

    @GetMapping
    @Operation(summary = "List adjustments by recognition period")
    public ResponseEntity<ApiResponse<PageResponse<RevenueAdjustmentResponse>>> list(
            @RequestParam UUID periodId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        Page<RevenueAdjustmentResponse> page = adjustmentService.listByPeriod(periodId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get adjustment by ID")
    public ResponseEntity<ApiResponse<RevenueAdjustmentResponse>> getById(@PathVariable UUID id) {
        RevenueAdjustmentResponse response = adjustmentService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER', 'ACCOUNTANT')")
    @Operation(summary = "Create a new revenue adjustment")
    public ResponseEntity<ApiResponse<RevenueAdjustmentResponse>> create(
            @Valid @RequestBody CreateRevenueAdjustmentRequest request) {
        RevenueAdjustmentResponse response = adjustmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Approve a revenue adjustment")
    public ResponseEntity<ApiResponse<RevenueAdjustmentResponse>> approve(
            @PathVariable UUID id,
            @RequestParam UUID approvedById) {
        RevenueAdjustmentResponse response = adjustmentService.approve(id, approvedById);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'FINANCE_MANAGER')")
    @Operation(summary = "Soft-delete a revenue adjustment")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        adjustmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
