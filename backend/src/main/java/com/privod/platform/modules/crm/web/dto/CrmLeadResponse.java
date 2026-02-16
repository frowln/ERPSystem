package com.privod.platform.modules.crm.web.dto;

import com.privod.platform.modules.crm.domain.CrmLead;
import com.privod.platform.modules.crm.domain.LeadPriority;
import com.privod.platform.modules.crm.domain.LeadStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CrmLeadResponse(
        UUID id,
        String name,
        String partnerName,
        String email,
        String phone,
        String companyName,
        String source,
        String medium,
        UUID stageId,
        UUID assignedToId,
        BigDecimal expectedRevenue,
        int probability,
        BigDecimal weightedRevenue,
        LeadPriority priority,
        String priorityDisplayName,
        String description,
        LeadStatus status,
        String statusDisplayName,
        String lostReason,
        LocalDate wonDate,
        UUID projectId,
        LocalDate nextActivityDate,
        boolean open,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static CrmLeadResponse fromEntity(CrmLead lead) {
        return new CrmLeadResponse(
                lead.getId(),
                lead.getName(),
                lead.getPartnerName(),
                lead.getEmail(),
                lead.getPhone(),
                lead.getCompanyName(),
                lead.getSource(),
                lead.getMedium(),
                lead.getStageId(),
                lead.getAssignedToId(),
                lead.getExpectedRevenue(),
                lead.getProbability(),
                lead.getWeightedRevenue(),
                lead.getPriority(),
                lead.getPriority().getDisplayName(),
                lead.getDescription(),
                lead.getStatus(),
                lead.getStatus().getDisplayName(),
                lead.getLostReason(),
                lead.getWonDate(),
                lead.getProjectId(),
                lead.getNextActivityDate(),
                lead.isOpen(),
                lead.getCreatedAt(),
                lead.getUpdatedAt(),
                lead.getCreatedBy()
        );
    }
}
