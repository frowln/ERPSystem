package com.privod.platform.modules.costManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.costManagement.domain.CommitmentStatus;
import com.privod.platform.modules.costManagement.service.CommitmentService;
import com.privod.platform.modules.costManagement.web.dto.ChangeCommitmentStatusRequest;
import com.privod.platform.modules.costManagement.web.dto.CommitmentItemResponse;
import com.privod.platform.modules.costManagement.web.dto.CommitmentResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateCommitmentItemRequest;
import com.privod.platform.modules.costManagement.web.dto.CreateCommitmentRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateCommitmentRequest;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/commitments")
@RequiredArgsConstructor
@Tag(name = "Commitments", description = "Commitment management endpoints")
public class CommitmentController {

    private final CommitmentService commitmentService;

    @GetMapping
    @Operation(summary = "List commitments by project with filtering and pagination")
    public ResponseEntity<ApiResponse<PageResponse<CommitmentResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) CommitmentStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<CommitmentResponse> page = commitmentService.listByProject(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get commitment by ID")
    public ResponseEntity<ApiResponse<CommitmentResponse>> getById(@PathVariable UUID id) {
        CommitmentResponse response = commitmentService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Create a new commitment")
    public ResponseEntity<ApiResponse<CommitmentResponse>> create(
            @Valid @RequestBody CreateCommitmentRequest request) {
        CommitmentResponse response = commitmentService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Update an existing commitment")
    public ResponseEntity<ApiResponse<CommitmentResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateCommitmentRequest request) {
        CommitmentResponse response = commitmentService.update(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Change commitment status")
    public ResponseEntity<ApiResponse<CommitmentResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeCommitmentStatusRequest request) {
        CommitmentResponse response = commitmentService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/{id}/change-orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Add a change order to a commitment")
    public ResponseEntity<ApiResponse<CommitmentResponse>> addChangeOrder(
            @PathVariable UUID id,
            @RequestParam BigDecimal amount) {
        CommitmentResponse response = commitmentService.addChangeOrder(id, amount);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}/items")
    @Operation(summary = "List items of a commitment")
    public ResponseEntity<ApiResponse<List<CommitmentItemResponse>>> listItems(@PathVariable UUID id) {
        List<CommitmentItemResponse> items = commitmentService.listItems(id);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Add an item to a commitment")
    public ResponseEntity<ApiResponse<CommitmentItemResponse>> addItem(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCommitmentItemRequest request) {
        CommitmentItemResponse response = commitmentService.addItem(id, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'COST_MANAGER')")
    @Operation(summary = "Delete a commitment item")
    public ResponseEntity<ApiResponse<Void>> deleteItem(@PathVariable UUID itemId) {
        commitmentService.deleteItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Delete a commitment (soft delete)")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        commitmentService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
