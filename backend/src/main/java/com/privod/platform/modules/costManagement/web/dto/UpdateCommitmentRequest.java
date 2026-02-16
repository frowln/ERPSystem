package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.CommitmentType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateCommitmentRequest(
        String title,
        CommitmentType commitmentType,
        UUID vendorId,
        UUID contractId,
        BigDecimal originalAmount,
        BigDecimal approvedChangeOrders,
        BigDecimal retentionPercent,
        LocalDate startDate,
        LocalDate endDate,
        UUID costCodeId
) {
}
