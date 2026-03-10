package com.privod.platform.modules.hr.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TimesheetT13CellResponse(
        UUID employeeId,
        String employeeName,
        int day,
        String code,
        BigDecimal dayHours,
        BigDecimal nightHours
) {}
