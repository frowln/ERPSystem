package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.StaffingVacancy;

import java.util.UUID;

public record StaffingVacancyResponse(
        UUID id,
        String status
) {
    public static StaffingVacancyResponse fromEntity(StaffingVacancy vacancy) {
        String statusStr = switch (vacancy.getStatus()) {
            case OPEN -> "open";
            case IN_PROGRESS -> "in_progress";
            case CLOSED -> "closed";
        };
        return new StaffingVacancyResponse(vacancy.getId(), statusStr);
    }
}
