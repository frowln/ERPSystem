package com.privod.platform.modules.subscription.web.dto;

import com.privod.platform.modules.subscription.domain.SubscriptionStatus;
import com.privod.platform.modules.subscription.domain.TenantSubscription;

import java.time.Instant;
import java.util.UUID;

public record TenantSubscriptionResponse(
        UUID id,
        UUID organizationId,
        UUID planId,
        String planName,
        String planDisplayName,
        SubscriptionStatus status,
        String statusDisplayName,
        Instant startDate,
        Instant endDate,
        Instant trialEndDate,
        Instant createdAt
) {
    public static TenantSubscriptionResponse fromEntity(TenantSubscription sub,
                                                         String planName,
                                                         String planDisplayName) {
        return new TenantSubscriptionResponse(
                sub.getId(),
                sub.getOrganizationId(),
                sub.getPlanId(),
                planName,
                planDisplayName,
                sub.getStatus(),
                sub.getStatus().getDisplayName(),
                sub.getStartDate(),
                sub.getEndDate(),
                sub.getTrialEndDate(),
                sub.getCreatedAt()
        );
    }
}
