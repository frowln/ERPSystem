package com.privod.platform.modules.hr.web.dto;

import java.time.LocalDate;
import java.util.UUID;

public record SeniorityRecordResponse(
        UUID employeeId,
        String employeeName,
        LocalDate hireDate,
        int seniorityYears,
        int seniorityMonths,
        int seniorityDays,
        int baseLeave,
        int additionalLeave,
        int totalLeave,
        int usedLeave,
        int remainingLeave
) {}
