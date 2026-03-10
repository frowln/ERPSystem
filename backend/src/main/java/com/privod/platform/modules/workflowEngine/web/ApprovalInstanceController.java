package com.privod.platform.modules.workflowEngine.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.workflowEngine.service.ApprovalInstanceService;
import com.privod.platform.modules.workflowEngine.service.ApprovalInstanceService.ApprovalDecisionResponse;
import com.privod.platform.modules.workflowEngine.service.ApprovalInstanceService.ApprovalInstanceResponse;
import com.privod.platform.modules.workflowEngine.service.ApprovalInstanceService.BatchDecisionRequest;
import com.privod.platform.modules.workflowEngine.service.ApprovalInstanceService.BatchDecisionResponse;
import com.privod.platform.modules.workflowEngine.service.ApprovalInstanceService.DelegateRequest;
import com.privod.platform.modules.workflowEngine.service.ApprovalInstanceService.StartApprovalRequest;
import com.privod.platform.modules.workflowEngine.service.ApprovalInstanceService.SubmitDecisionRequest;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/approval-instances")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER', 'FINANCE_MANAGER')")
@Tag(name = "Approval Instances", description = "Управление процессами согласования")
public class ApprovalInstanceController {

    private final ApprovalInstanceService approvalInstanceService;

    @PostMapping
    @Operation(summary = "Start a new approval workflow for an entity")
    public ResponseEntity<ApiResponse<ApprovalInstanceResponse>> startApproval(
            @Valid @RequestBody StartApprovalRequest request) {
        ApprovalInstanceResponse response = approvalInstanceService.startApproval(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @GetMapping("/inbox")
    @Operation(summary = "Get pending approvals for the current user")
    public ResponseEntity<ApiResponse<PageResponse<ApprovalInstanceResponse>>> getInbox(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<ApprovalInstanceResponse> page = approvalInstanceService.getPendingForUser(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get approval instance details by ID")
    public ResponseEntity<ApiResponse<ApprovalInstanceResponse>> getInstance(@PathVariable UUID id) {
        ApprovalInstanceResponse response = approvalInstanceService.getInstance(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/decision")
    @Operation(summary = "Submit approval decision (APPROVED / REJECTED)")
    public ResponseEntity<ApiResponse<ApprovalInstanceResponse>> submitDecision(
            @PathVariable UUID id,
            @Valid @RequestBody SubmitDecisionRequest request) {
        ApprovalInstanceResponse response = approvalInstanceService.submitDecision(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/batch-decision")
    @Operation(summary = "Пакетное принятие решений по нескольким процессам согласования")
    public ResponseEntity<ApiResponse<BatchDecisionResponse>> batchDecision(
            @Valid @RequestBody BatchDecisionRequest request) {
        BatchDecisionResponse response = approvalInstanceService.batchDecision(request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/delegate")
    @Operation(summary = "Delegate current approval step to another user")
    public ResponseEntity<ApiResponse<ApprovalInstanceResponse>> delegate(
            @PathVariable UUID id,
            @Valid @RequestBody DelegateRequest request) {
        ApprovalInstanceResponse response = approvalInstanceService.delegate(
                id, request.delegateToId(), request.comments());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel an in-progress approval workflow")
    public ResponseEntity<ApiResponse<ApprovalInstanceResponse>> cancel(@PathVariable UUID id) {
        ApprovalInstanceResponse response = approvalInstanceService.cancel(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/entity/{entityType}/{entityId}/history")
    @Operation(summary = "Get full approval history for a specific entity")
    public ResponseEntity<ApiResponse<List<ApprovalDecisionResponse>>> getHistory(
            @PathVariable String entityType,
            @PathVariable UUID entityId) {
        List<ApprovalDecisionResponse> history = approvalInstanceService.getHistory(entityId, entityType);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }
}
