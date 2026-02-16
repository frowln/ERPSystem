package com.privod.platform.modules.payroll.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record BulkPayrollCalculateRequest(
        @NotEmpty(message = "Список расчётов не может быть пустым")
        @Valid
        List<PayrollCalculateRequest> calculations
) {
}
