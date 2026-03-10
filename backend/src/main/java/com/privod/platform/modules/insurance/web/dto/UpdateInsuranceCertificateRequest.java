package com.privod.platform.modules.insurance.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateInsuranceCertificateRequest(
    UUID vendorId,
    String vendorName,
    String certificateType,
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
