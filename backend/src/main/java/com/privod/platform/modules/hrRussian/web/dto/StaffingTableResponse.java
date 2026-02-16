package com.privod.platform.modules.hrRussian.web.dto;

import com.privod.platform.modules.hrRussian.domain.StaffingTable;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record StaffingTableResponse(
        UUID id,
        String positionName,
        UUID departmentId,
        String grade,
        BigDecimal salaryMin,
        BigDecimal salaryMax,
        int headcount,
        int filledCount,
        int vacancyCount,
        boolean active,
        LocalDate effectiveDate,
        Instant createdAt,
        Instant updatedAt
) {
    public static StaffingTableResponse fromEntity(StaffingTable st) {
        return new StaffingTableResponse(
                st.getId(),
                st.getPositionName(),
                st.getDepartmentId(),
                st.getGrade(),
                st.getSalaryMin(),
                st.getSalaryMax(),
                st.getHeadcount(),
                st.getFilledCount(),
                st.getVacancyCount(),
                st.isActive(),
                st.getEffectiveDate(),
                st.getCreatedAt(),
                st.getUpdatedAt()
        );
    }
}
