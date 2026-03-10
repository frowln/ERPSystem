package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdatePaymentPriorityRequest {
    @NotNull
    private Integer priority;
}
