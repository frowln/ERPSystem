package com.privod.platform.modules.changeManagement.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.changeManagement.service.ChangeOrderService;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderItemResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderStatusRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeOrderItemRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeOrderRequest;
import com.privod.platform.modules.changeManagement.web.dto.UpdateChangeOrderRequest;
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
@RequestMapping("/api/change-orders")
@RequiredArgsConstructor
@Tag(name = "Change Orders", description = "Change order management endpoints")
public class ChangeOrderController {

    private final ChangeOrderService changeOrderService;

    @GetMapping
    @Operation(summary = "List change orders, optionally filtered by project")
    public ResponseEntity<ApiResponse<PageResponse<ChangeOrderResponse>>> list(
            @RequestParam(required = false) UUID projectId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ChangeOrderResponse> page = projectId != null
                ? changeOrderService.listByProject(projectId, pageable)
                : changeOrderService.listAll(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/by-contract/{contractId}")
    @Operation(summary = "List change orders by contract")
    public ResponseEntity<ApiResponse<PageResponse<ChangeOrderResponse>>> listByContract(
            @PathVariable UUID contractId,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ChangeOrderResponse> page = changeOrderService.listByContract(contractId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get change order by ID")
    public ResponseEntity<ApiResponse<ChangeOrderResponse>> getById(@PathVariable UUID id) {
        ChangeOrderResponse response = changeOrderService.getChangeOrder(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Create a new change order")
    public ResponseEntity<ApiResponse<ChangeOrderResponse>> create(
            @Valid @RequestBody CreateChangeOrderRequest request) {
        ChangeOrderResponse response = changeOrderService.createChangeOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Update an existing change order")
    public ResponseEntity<ApiResponse<ChangeOrderResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateChangeOrderRequest request) {
        ChangeOrderResponse response = changeOrderService.updateChangeOrder(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Change status of a change order")
    public ResponseEntity<ApiResponse<ChangeOrderResponse>> changeStatus(
            @PathVariable UUID id,
            @Valid @RequestBody ChangeOrderStatusRequest request) {
        ChangeOrderResponse response = changeOrderService.changeStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER')")
    @Operation(summary = "Soft delete a change order")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        changeOrderService.deleteChangeOrder(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    // --- Items ---

    @GetMapping("/{id}/items")
    @Operation(summary = "List items of a change order")
    public ResponseEntity<ApiResponse<List<ChangeOrderItemResponse>>> listItems(@PathVariable UUID id) {
        List<ChangeOrderItemResponse> items = changeOrderService.listItems(id);
        return ResponseEntity.ok(ApiResponse.ok(items));
    }

    @PostMapping("/{id}/items")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Add an item to a change order")
    public ResponseEntity<ApiResponse<ChangeOrderItemResponse>> addItem(
            @PathVariable UUID id,
            @Valid @RequestBody CreateChangeOrderItemRequest request) {
        // Override changeOrderId from path
        CreateChangeOrderItemRequest adjusted = new CreateChangeOrderItemRequest(
                id, request.description(), request.quantity(), request.unit(),
                request.unitPrice(), request.costCodeId(), request.wbsNodeId(), request.sortOrder());
        ChangeOrderItemResponse response = changeOrderService.addItem(adjusted);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(response));
    }

    @DeleteMapping("/items/{itemId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'CONTRACT_MANAGER')")
    @Operation(summary = "Remove an item from a change order")
    public ResponseEntity<ApiResponse<Void>> removeItem(@PathVariable UUID itemId) {
        changeOrderService.removeItem(itemId);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/revised-amount")
    @Operation(summary = "Calculate revised contract amount including approved change orders")
    public ResponseEntity<ApiResponse<BigDecimal>> getRevisedContractAmount(
            @RequestParam UUID contractId,
            @RequestParam BigDecimal originalAmount) {
        BigDecimal revised = changeOrderService.calculateRevisedContractAmount(contractId, originalAmount);
        return ResponseEntity.ok(ApiResponse.ok(revised));
    }
}
