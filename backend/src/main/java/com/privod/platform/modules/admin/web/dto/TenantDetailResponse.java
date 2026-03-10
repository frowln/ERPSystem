package com.privod.platform.modules.admin.web.dto;

import java.time.Instant;
import java.util.UUID;

public record TenantDetailResponse(
        UUID id,
        String name,
        String inn,
        String kpp,
        String ogrn,
        String legalAddress,
        String actualAddress,
        String phone,
        String email,
        String type,
        boolean active,
        String status,
        String planName,
        String planDisplayName,
        UUID planId,
        String subscriptionStatus,
        Instant subscriptionStartDate,
        Instant subscriptionEndDate,
        Instant trialEndDate,
        long userCount,
        long projectCount,
        long storageUsedMb,
        Instant createdAt,
        Instant updatedAt
) {}
