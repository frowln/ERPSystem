package com.privod.platform.modules.contract.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateContractRequest(
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        LocalDate contractDate,

        UUID partnerId,

        @Size(max = 500)
        String partnerName,

        UUID projectId,

        UUID typeId,

        @DecimalMin(value = "0", message = "Сумма договора не может быть отрицательной")
        BigDecimal amount,

        BigDecimal vatRate,

        String paymentTerms,

        LocalDate plannedStartDate,

        LocalDate plannedEndDate,

        LocalDate actualStartDate,

        LocalDate actualEndDate,

        UUID responsibleId,

        @DecimalMin(value = "0", message = "Процент удержания не может быть отрицательным")
        BigDecimal retentionPercent,

        @DecimalMin(value = "0", message = "Процент предоплаты не может быть отрицательным")
        BigDecimal prepaymentPercent,

        Integer paymentDelayDays,

        Integer guaranteePeriodMonths,

        String direction,

        String notes
) {
}
