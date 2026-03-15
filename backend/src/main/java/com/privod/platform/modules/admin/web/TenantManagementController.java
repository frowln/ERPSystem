package com.privod.platform.modules.admin.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.modules.admin.service.TenantManagementService;
import com.privod.platform.modules.admin.web.dto.ExtendSubscriptionRequest;
import com.privod.platform.modules.admin.web.dto.TenantDetailResponse;
import com.privod.platform.modules.admin.web.dto.TenantListResponse;
import com.privod.platform.modules.admin.web.dto.UpdateTenantPlanRequest;
import com.privod.platform.modules.admin.web.dto.UpdateTenantStatusRequest;
import com.privod.platform.modules.subscription.domain.BillingRecord;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/admin/tenants")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Tenant Management", description = "Superadmin tenant management endpoints")
public class TenantManagementController {

    private final TenantManagementService tenantManagementService;

    @GetMapping
    @Operation(summary = "List all tenants (organizations) with pagination")
    public ResponseEntity<ApiResponse<PageResponse<TenantListResponse>>> listTenants(
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "name", direction = Sort.Direction.ASC) Pageable pageable) {
        Page<TenantListResponse> page = tenantManagementService.findAllTenants(search, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get tenant details by ID")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> getTenantDetail(@PathVariable UUID id) {
        TenantDetailResponse detail = tenantManagementService.getTenantDetail(id);
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update tenant status (activate/suspend/cancel)")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantStatusRequest request) {
        TenantDetailResponse detail = tenantManagementService.updateTenantStatus(id, request.status());
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    @PutMapping("/{id}/plan")
    @Operation(summary = "Change tenant subscription plan")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> updatePlan(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateTenantPlanRequest request) {
        TenantDetailResponse detail = tenantManagementService.updateTenantPlan(id, request.planId());
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    @PutMapping("/{id}/extend")
    @Operation(summary = "Extend tenant subscription by N months")
    public ResponseEntity<ApiResponse<TenantDetailResponse>> extendSubscription(
            @PathVariable UUID id,
            @Valid @RequestBody ExtendSubscriptionRequest request) {
        TenantDetailResponse detail = tenantManagementService.extendSubscription(id, request.months());
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    @GetMapping("/{id}/billing")
    @Operation(summary = "Get billing records for a tenant's organization")
    public ResponseEntity<ApiResponse<PageResponse<BillingRecord>>> getTenantBilling(
            @PathVariable UUID id,
            @PageableDefault(size = 20, sort = "invoiceDate", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<BillingRecord> page = tenantManagementService.getTenantBillingRecords(id, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(page)));
    }
}
