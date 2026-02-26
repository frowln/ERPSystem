package com.privod.platform.modules.subscription.web.dto;

import com.privod.platform.modules.subscription.domain.BillingPeriod;
import com.privod.platform.modules.subscription.domain.PlanName;
import com.privod.platform.modules.subscription.domain.SubscriptionPlan;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public record SubscriptionPlanResponse(
        UUID id,
        PlanName name,
        String displayName,
        BigDecimal price,
        String currency,
        BillingPeriod billingPeriod,
        Integer maxUsers,
        Integer maxProjects,
        Integer maxStorageGb,
        List<String> features,
        boolean isActive
) {
    public static SubscriptionPlanResponse fromEntity(SubscriptionPlan plan) {
        List<String> featureList = plan.getFeatures() != null && !plan.getFeatures().isBlank()
                ? Arrays.asList(plan.getFeatures().split(","))
                : List.of();

        return new SubscriptionPlanResponse(
                plan.getId(),
                plan.getName(),
                plan.getDisplayName(),
                plan.getPrice(),
                plan.getCurrency(),
                plan.getBillingPeriod(),
                plan.getMaxUsers(),
                plan.getMaxProjects(),
                plan.getMaxStorageGb(),
                featureList,
                plan.isActive()
        );
    }
}
