package com.privod.platform.modules.safety.web.dto;

public record AutoScheduleResponse(
        int briefingsCreated,
        int employeesProcessed,
        int rulesApplied
) {
}
