package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.DepreciationMethod;
import com.privod.platform.modules.accounting.domain.FixedAsset;
import com.privod.platform.modules.accounting.domain.FixedAssetStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record FixedAssetResponse(
        UUID id,
        String code,
        String name,
        String inventoryNumber,
        UUID accountId,
        LocalDate purchaseDate,
        BigDecimal purchaseAmount,
        Integer usefulLifeMonths,
        DepreciationMethod depreciationMethod,
        String depreciationMethodDisplayName,
        BigDecimal currentValue,
        FixedAssetStatus status,
        String statusDisplayName,
        BigDecimal monthlyDepreciation,
        Instant createdAt,
        String createdBy
) {
    public static FixedAssetResponse fromEntity(FixedAsset entity) {
        return new FixedAssetResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getInventoryNumber(),
                entity.getAccountId(),
                entity.getPurchaseDate(),
                entity.getPurchaseAmount(),
                entity.getUsefulLifeMonths(),
                entity.getDepreciationMethod(),
                entity.getDepreciationMethod().getDisplayName(),
                entity.getCurrentValue(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.calculateMonthlyDepreciation(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
