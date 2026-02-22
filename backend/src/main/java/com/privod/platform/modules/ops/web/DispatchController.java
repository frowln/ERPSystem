package com.privod.platform.modules.ops.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.ops.domain.DispatchRoute;
import com.privod.platform.modules.ops.domain.DispatchStatus;
import com.privod.platform.modules.ops.service.DispatchService;
import com.privod.platform.modules.ops.web.dto.CreateDispatchOrderRequest;
import com.privod.platform.modules.ops.web.dto.CreateDispatchRouteRequest;
import com.privod.platform.modules.ops.web.dto.DispatchOrderResponse;
import com.privod.platform.modules.ops.web.dto.UpdateDispatchStatusRequest;
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

@RestController("opsDispatchController")
@RequestMapping("/api/dispatch")
@RequiredArgsConstructor
@Tag(name = "Dispatch", description = "Dispatch orders and routes")
public class DispatchController {

    private final DispatchService dispatchService;

    @GetMapping("/orders")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List dispatch orders")
    public ResponseEntity<ApiResponse<PageResponse<DispatchOrderResponse>>> listOrders(
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) DispatchStatus status,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<DispatchOrderResponse> page = dispatchService.listOrders(projectId, status, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/orders/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get dispatch order by ID")
    public ResponseEntity<ApiResponse<DispatchOrderResponse>> getOrder(@PathVariable UUID id) {
        DispatchOrderResponse response = dispatchService.getOrder(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/orders")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Create dispatch order")
    public ResponseEntity<ApiResponse<DispatchOrderResponse>> createOrder(
            @Valid @RequestBody CreateDispatchOrderRequest request) {
        DispatchOrderResponse response = dispatchService.createOrder(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/orders/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Update dispatch order")
    public ResponseEntity<ApiResponse<DispatchOrderResponse>> updateOrder(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDispatchOrderRequest request) {
        DispatchOrderResponse response = dispatchService.updateOrder(id, request);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PatchMapping("/orders/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Update dispatch order status")
    public ResponseEntity<ApiResponse<DispatchOrderResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDispatchStatusRequest request) {
        DispatchOrderResponse response = dispatchService.transitionStatus(id, request.status());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/orders/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER')")
    @Operation(summary = "Delete dispatch order")
    public ResponseEntity<ApiResponse<Void>> deleteOrder(@PathVariable UUID id) {
        dispatchService.deleteOrder(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }

    @GetMapping("/routes")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "List dispatch routes")
    public ResponseEntity<ApiResponse<PageResponse<DispatchRoute>>> listRoutes(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<DispatchRoute> page = dispatchService.listRoutes(pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/routes/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get dispatch route by ID")
    public ResponseEntity<ApiResponse<DispatchRoute>> getRoute(@PathVariable UUID id) {
        DispatchRoute response = dispatchService.getRoute(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/routes")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Create dispatch route")
    public ResponseEntity<ApiResponse<DispatchRoute>> createRoute(
            @Valid @RequestBody CreateDispatchRouteRequest request) {
        DispatchRoute route = DispatchRoute.builder()
                .name(request.name())
                .fromLocation(request.fromLocation())
                .toLocation(request.toLocation())
                .distanceKm(request.distanceKm())
                .estimatedDurationMinutes(request.estimatedDurationMinutes() != null ? request.estimatedDurationMinutes() : 0)
                .build();
        DispatchRoute response = dispatchService.createRoute(route);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(response));
    }

    @PutMapping("/routes/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER', 'LOGISTICS_MANAGER')")
    @Operation(summary = "Update dispatch route")
    public ResponseEntity<ApiResponse<DispatchRoute>> updateRoute(
            @PathVariable UUID id,
            @Valid @RequestBody CreateDispatchRouteRequest request) {
        DispatchRoute updates = DispatchRoute.builder()
                .name(request.name())
                .fromLocation(request.fromLocation())
                .toLocation(request.toLocation())
                .distanceKm(request.distanceKm())
                .estimatedDurationMinutes(request.estimatedDurationMinutes() != null ? request.estimatedDurationMinutes() : 0)
                .build();
        DispatchRoute response = dispatchService.updateRoute(id, updates);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @DeleteMapping("/routes/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'PROJECT_MANAGER', 'SUPPLY_MANAGER')")
    @Operation(summary = "Delete dispatch route")
    public ResponseEntity<ApiResponse<Void>> deleteRoute(@PathVariable UUID id) {
        dispatchService.deleteRoute(id);
        return ResponseEntity.ok(ApiResponse.ok());
    }
}
