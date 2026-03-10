package com.privod.platform.modules.finance.web.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class BankExportGenerateRequest {
    @NotEmpty
    private List<UUID> paymentIds;

    @NotBlank
    private String format;
}
