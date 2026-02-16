package com.privod.platform.modules.workflowEngine.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.workflowEngine.domain.ApprovalEntityType;
import com.privod.platform.modules.workflowEngine.service.AutoApprovalRuleService;
import com.privod.platform.modules.workflowEngine.web.dto.AutoApprovalRuleResponse;
import com.privod.platform.modules.workflowEngine.web.dto.CreateAutoApprovalRuleRequest;
import com.privod.platform.modules.workflowEngine.web.dto.UpdateAutoApprovalRuleRequest;
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
@RequestMapping("/api/approval-rules")
@RequiredArgsConstructor
@Tag(name = "Auto Approval Rules", description = "Правила автоматического согласования")
public class AutoApprovalRuleController {

    private final AutoApprovalRuleService autoApprovalRuleService;

    @GetMapping
    @Operation(summary = "List auto-approval rules with filtering, pagination, and sorting")
    public ResponseEntity<ApiResponse<PageResponse<AutoApprovalRuleResponse>>> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) ApprovalEntityType entityType,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(required = false) UUID organizationId,
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<AutoApprovalRuleResponse> page = autoApprovalRuleService.findAll(
                search, entityType, isActive, organizationId, projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get auto-approval rule by ID")
    public ResponseEntity<ApiResponse<AutoApprovalRuleResponse>> getById(@PathVariable UUID id) {
        AutoApprovalRuleResponse response = autoApprovalRuleService.findById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Create a new auto-approval rule")
    public ResponseEntity<ApiResponse<AutoApprovalRuleResponse>> create(
            @Valid @RequestBody CreateAutoApprovalRuleRequest request) {
        AutoApprovalRuleResponse response = autoApprovalRuleService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Update an existing auto-approval rule")
    public ResponseEntity<ApiResponse<AutoApprovalRuleResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAutoApprovalRuleRequest request) {
        AutoApprovalRuleResponse response = autoApprovalRuleService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Toggle active state of an auto-approval rule")
    public ResponseEntity<ApiResponse<AutoApprovalRuleResponse>> toggleActive(@PathVariable UUID id) {
        AutoApprovalRuleResponse response = autoApprovalRuleService.toggleActive(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete an auto-approval rule (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        autoApprovalRuleService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
