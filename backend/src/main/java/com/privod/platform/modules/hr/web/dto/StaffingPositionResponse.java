package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.StaffingPosition;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record StaffingPositionResponse(
        UUID id,
        String department,
        String position,
        String grade,
        BigDecimal salaryMin,
        BigDecimal salaryMax,
        int filled,
        int total,
        List<StaffingVacancyResponse> vacancies
) {
    public static StaffingPositionResponse fromEntity(StaffingPosition entity, List<StaffingVacancyResponse> vacancies) {
        return new StaffingPositionResponse(
                entity.getId(),
                entity.getDepartment(),
                entity.getPosition(),
                entity.getGrade(),
                entity.getSalaryMin(),
                entity.getSalaryMax(),
                entity.getFilledCount(),
                entity.getTotalCount(),
                vacancies
        );
    }
}
