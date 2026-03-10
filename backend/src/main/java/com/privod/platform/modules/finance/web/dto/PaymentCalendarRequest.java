package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class PaymentCalendarRequest {
    @NotNull
    private UUID projectId;

    @NotBlank
    private String startDate;

    @NotBlank
    private String endDate;

    @NotBlank
    private String frequency;

    private String paymentType;
    private Boolean includeApproved;
    private Boolean includePlanned;
    private Boolean autoDistribute;
}
