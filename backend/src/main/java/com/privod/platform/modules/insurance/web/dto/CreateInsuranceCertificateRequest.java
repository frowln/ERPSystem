package com.privod.platform.modules.insurance.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateInsuranceCertificateRequest(
    UUID vendorId,
    @NotBlank String vendorName,
    @NotNull String certificateType,
    String policyNumber,
    String insurerName,
    BigDecimal coverageAmount,
    BigDecimal deductible,
    String effectiveDate,
    String expiryDate,
    String certificateHolder,
    String status,
    String storagePath,
    String notes
) {}
