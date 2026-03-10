package com.privod.platform.modules.contract.web.dto;

import java.util.List;
import java.util.UUID;

public record ProcurementComplianceResponse(
        UUID contractId,
        String procurementLaw,
        String overallStatus,
        List<ChecklistItem> checklist
) {
    public record ChecklistItem(
            String code,
            String name,
            boolean required,
            boolean provided
    ) {
    }
}
