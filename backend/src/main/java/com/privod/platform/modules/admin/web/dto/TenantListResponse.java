package com.privod.platform.modules.admin.web.dto;

import java.time.Instant;
import java.util.UUID;

public record TenantListResponse(
        UUID id,
        String name,
        String inn,
        String status,
        String planName,
        long userCount,
        long projectCount,
        Instant createdAt
) {}
