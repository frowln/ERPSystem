package com.privod.platform.modules.hr.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TimesheetSummaryResponse(
        UUID projectId,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal totalHours,
        BigDecimal totalOvertimeHours,
        int entryCount,
        List<TimesheetResponse> entries
) {
}
