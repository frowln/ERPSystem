package com.privod.platform.modules.bidManagement.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateBidInvitationRequest(
        UUID vendorId,
        String vendorName,
        String vendorEmail,
        String status,
        BigDecimal bidAmount,
        String bidNotes,
        Integer attachmentsCount
) {}
