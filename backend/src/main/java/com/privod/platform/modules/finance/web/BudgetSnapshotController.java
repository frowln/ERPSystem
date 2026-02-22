package com.privod.platform.modules.finance.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.finance.service.BudgetSnapshotService;
import com.privod.platform.modules.finance.web.dto.BudgetSnapshotResponse;
import com.privod.platform.modules.finance.web.dto.CreateSnapshotRequest;
import com.privod.platform.modules.finance.web.dto.SnapshotComparisonResponse;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/budgets/{budgetId}/snapshots")
@RequiredArgsConstructor
@Tag(name = "Budget Snapshots", description = "Financial model snapshot management")
public class BudgetSnapshotController {

    private final BudgetSnapshotService snapshotService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Create a snapshot of the current financial model state")
    public ResponseEntity<ApiResponse<BudgetSnapshotResponse>> create(
            @PathVariable UUID budgetId,
            @Valid @RequestBody CreateSnapshotRequest request) {
        BudgetSnapshotResponse response = snapshotService.createSnapshot(budgetId, request.name(), request.notes());
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @GetMapping
    @Operation(summary = "List snapshots for a budget")
    public ResponseEntity<ApiResponse<PageResponse<BudgetSnapshotResponse>>> list(
            @PathVariable UUID budgetId,
            @PageableDefault(size = 20, sort = "snapshotDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<BudgetSnapshotResponse> page = snapshotService.listSnapshots(budgetId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{snapshotId}/compare")
    @Operation(summary = "Compare a snapshot with the current state")
    public ResponseEntity<ApiResponse<SnapshotComparisonResponse>> compare(
            @PathVariable UUID budgetId,
            @PathVariable UUID snapshotId) {
        SnapshotComparisonResponse response = snapshotService.compareWithCurrent(snapshotId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
