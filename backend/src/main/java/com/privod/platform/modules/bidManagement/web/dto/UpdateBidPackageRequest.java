package com.privod.platform.modules.bidManagement.web.dto;

import java.time.LocalDateTime;

public record UpdateBidPackageRequest(
        String name,
        String description,
        String status,
        LocalDateTime bidDueDate,
        String scopeOfWork,
        String specSections
) {}
