package com.privod.platform.modules.bidManagement.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateBidInvitationRequest(
        UUID vendorId,
        @NotBlank String vendorName,
        String vendorEmail,
        BigDecimal bidAmount,
        String bidNotes
) {}
