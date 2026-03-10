package com.privod.platform.modules.approval.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.approval.service.ApprovalService;
import com.privod.platform.modules.approval.web.dto.ApprovalChainResponse;
import com.privod.platform.modules.approval.web.dto.ApprovalDecisionRequest;
import com.privod.platform.modules.approval.web.dto.ApprovalStepResponse;
import com.privod.platform.modules.approval.web.dto.CreateApprovalChainRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
@Tag(name = "Approvals", description = "Approval workflow management")
public class ApprovalController {

    private final ApprovalService approvalService;

    @GetMapping
    @Operation(summary = "Get approval chain(s) — filter by entityType+entityId, or list all for org")
    public ResponseEntity<?> getChains(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID entityId) {
        if (entityType != null && entityId != null) {
            ApprovalChainResponse response = approvalService.getChain(entityType, entityId);
            return ResponseEntity.ok(ApiResponse.ok(response));
        }
        // No filter — return all chains for current organization
        java.util.List<ApprovalChainResponse> list = approvalService.listChains();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get approval chain by ID")
    public ResponseEntity<ApiResponse<ApprovalChainResponse>> getChainById(@PathVariable UUID id) {
        ApprovalChainResponse response = approvalService.getChainById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Create a new approval chain")
    public ResponseEntity<ApiResponse<ApprovalChainResponse>> createChain(
            @Valid @RequestBody CreateApprovalChainRequest request) {
        ApprovalChainResponse response = approvalService.createChain(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PostMapping("/steps/{stepId}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Approve an approval step")
    public ResponseEntity<ApiResponse<ApprovalStepResponse>> approveStep(
            @PathVariable UUID stepId,
            @RequestBody(required = false) ApprovalDecisionRequest request) {
        String comment = request != null ? request.getComment() : null;
        ApprovalStepResponse response = approvalService.approveStep(stepId, comment);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/steps/{stepId}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'FINANCE_MANAGER')")
    @Operation(summary = "Reject an approval step")
    public ResponseEntity<ApiResponse<ApprovalStepResponse>> rejectStep(
            @PathVariable UUID stepId,
            @RequestBody(required = false) ApprovalDecisionRequest request) {
        String comment = request != null ? request.getComment() : null;
        ApprovalStepResponse response = approvalService.rejectStep(stepId, comment);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
