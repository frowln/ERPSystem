package com.privod.platform.modules.bidManagement.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateBidPackageRequest(
        @NotNull UUID projectId,
        @NotBlank String name,
        String description,
        LocalDateTime bidDueDate,
        String scopeOfWork,
        String specSections
) {}
