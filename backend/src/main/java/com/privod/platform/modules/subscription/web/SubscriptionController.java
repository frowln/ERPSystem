package com.privod.platform.modules.subscription.web;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.subscription.service.SubscriptionService;
import com.privod.platform.modules.subscription.web.dto.BillingRecordResponse;
import com.privod.platform.modules.subscription.web.dto.ChangePlanRequest;
import com.privod.platform.modules.subscription.web.dto.QuotaResponse;
import com.privod.platform.modules.subscription.web.dto.SubscriptionPlanResponse;
import com.privod.platform.modules.subscription.web.dto.TenantSubscriptionResponse;
import com.privod.platform.modules.subscription.web.dto.UsageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscriptions", description = "Subscription and plan management endpoints")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    @GetMapping("/plans")
    @Operation(summary = "List all available subscription plans")
    public ResponseEntity<ApiResponse<List<SubscriptionPlanResponse>>> listPlans() {
        List<SubscriptionPlanResponse> plans = subscriptionService.getPlans();
        return ResponseEntity.ok(ApiResponse.ok(plans));
    }

    @GetMapping("/current")
    @Operation(summary = "Get current subscription for the authenticated organization")
    public ResponseEntity<ApiResponse<TenantSubscriptionResponse>> getCurrentSubscription() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        TenantSubscriptionResponse response = subscriptionService.getCurrentSubscription(organizationId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @PostMapping("/change")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Change subscription plan")
    public ResponseEntity<ApiResponse<TenantSubscriptionResponse>> changePlan(
            @Valid @RequestBody ChangePlanRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        TenantSubscriptionResponse response = subscriptionService.changePlan(organizationId, request.planId());
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/usage")
    @Operation(summary = "Get current usage statistics (users, projects, storage)")
    public ResponseEntity<ApiResponse<UsageResponse>> getUsage() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UsageResponse response = subscriptionService.getUsage(organizationId);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/check-feature")
    @Operation(summary = "Check if the current organization has access to a specific feature")
    public ResponseEntity<ApiResponse<Boolean>> checkFeature(@RequestParam String featureKey) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        boolean hasAccess = subscriptionService.checkFeatureAccess(organizationId, featureKey);
        return ResponseEntity.ok(ApiResponse.ok(hasAccess));
    }

    @GetMapping("/check-quota")
    @Operation(summary = "Check quota for a specific resource type")
    public ResponseEntity<ApiResponse<QuotaResponse>> checkQuota(@RequestParam String quotaType) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        QuotaResponse response = subscriptionService.checkQuota(organizationId, quotaType);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/billing-history")
    @PreAuthorize("hasAnyRole('ADMIN')")
    @Operation(summary = "Get billing history for the authenticated organization")
    public ResponseEntity<ApiResponse<Page<BillingRecordResponse>>> getBillingHistory(
            @PageableDefault(size = 20) Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Page<BillingRecordResponse> response = subscriptionService.getBillingHistory(organizationId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }
}
