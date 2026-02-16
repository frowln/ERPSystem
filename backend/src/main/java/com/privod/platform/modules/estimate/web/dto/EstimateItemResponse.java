package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.EstimateItem;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EstimateItemResponse(
        UUID id,
        UUID estimateId,
        UUID projectId,
        UUID specItemId,
        Integer sequence,
        String name,
        BigDecimal quantity,
        String unitOfMeasure,
        BigDecimal unitPrice,
        BigDecimal unitPriceCustomer,
        BigDecimal amount,
        BigDecimal amountCustomer,
        BigDecimal orderedAmount,
        BigDecimal invoicedAmount,
        BigDecimal deliveredAmount,
        BigDecimal balance,
        BigDecimal balancePercent,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static EstimateItemResponse fromEntity(EstimateItem item) {
        return new EstimateItemResponse(
                item.getId(),
                item.getEstimateId(),
                item.getProjectId(),
                item.getSpecItemId(),
                item.getSequence(),
                item.getName(),
                item.getQuantity(),
                item.getUnitOfMeasure(),
                item.getUnitPrice(),
                item.getUnitPriceCustomer(),
                item.getAmount(),
                item.getAmountCustomer(),
                item.getOrderedAmount(),
                item.getInvoicedAmount(),
                item.getDeliveredAmount(),
                item.getBalance(),
                item.getBalancePercent(),
                item.getNotes(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
