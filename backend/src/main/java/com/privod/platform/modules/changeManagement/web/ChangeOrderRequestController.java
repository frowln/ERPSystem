package com.privod.platform.modules.changeManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.changeManagement.service.ChangeOrderRequestService;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderRequestResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderRequestStatusRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeOrderRequestRequest;
import com.privod.platform.modules.changeManagement.web.dto.UpdateChangeOrderRequestRequest;
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
@RequestMapping("/api/change-order-requests")
@RequiredArgsConstructor
@Tag(name = "Change Order Requests", description = "Change order request (RFQ) management endpoints")
public class ChangeOrderRequestController {

    private final ChangeOrderRequestService changeOrderRequestService;

    @GetMapping
    @Operation(summary = "List change order requests by project")
    public ResponseEntity<ApiResponse<PageResponse<ChangeOrderRequestResponse>>> listByProject(
            @RequestParam UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ChangeOrderRequestResponse> page = changeOrderRequestService.listByProject(projectId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/by-event/{changeEventId}")
    @Operation(summary = "List change order requests by change event")
    public ResponseEntity<ApiResponse<PageResponse<ChangeOrderRequestResponse>>> listByChangeEvent(
            @PathVariable UUID changeEventId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ChangeOrderRequestResponse> page = changeOrderRequestService.listByChangeEvent(changeEventId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get change order request by ID")
    public ResponseEntity<ApiResponse<ChangeOrderRequestResponse>> getById(@PathVariable UUID id) {
        ChangeOrderRequestResponse response = changeOrderRequestService.getChangeOrderRequest(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a new change order request")
    public ResponseEntity<ApiResponse<ChangeOrderRequestResponse>> create(
            @Valid @RequestBody CreateChangeOrderRequestRequest request) {
        ChangeOrderRequestResponse response = changeOrderRequestService.createChangeOrderRequest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Update an existing change order request")
    public ResponseEntity<ApiResponse<ChangeOrderRequestResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateChangeOrderRequestRequest request) {
        ChangeOrderRequestResponse response = changeOrderRequestService.updateChangeOrderRequest(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Change status of a change order request")
    public ResponseEntity<ApiResponse<ChangeOrderRequestResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeOrderRequestStatusRequest request) {
        ChangeOrderRequestResponse response = changeOrderRequestService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft delete a change order request")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        changeOrderRequestService.deleteChangeOrderRequest(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
