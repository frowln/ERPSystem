package com.privod.platform.modules.hr.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record TimesheetT13RowResponse(
        UUID employeeId,
        String employeeName,
        String position,
        List<TimesheetT13CellResponse> cells,
        int totalDays,
        BigDecimal totalHours,
        BigDecimal totalNightHours
) {}
