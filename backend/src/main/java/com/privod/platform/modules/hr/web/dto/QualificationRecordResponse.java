package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.QualificationRecord;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

public record QualificationRecordResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        String qualificationType,
        String certificateNumber,
        LocalDate issueDate,
        LocalDate expiryDate,
        String status,
        long daysRemaining
) {
    public static QualificationRecordResponse fromEntity(QualificationRecord entity) {
        long days = ChronoUnit.DAYS.between(LocalDate.now(), entity.getExpiryDate());
        return new QualificationRecordResponse(
                entity.getId(),
                entity.getEmployeeId(),
                entity.getEmployeeName(),
                entity.getQualificationType(),
                entity.getCertificateNumber(),
                entity.getIssueDate(),
                entity.getExpiryDate(),
                entity.getStatus().name().toLowerCase(),
                Math.max(days, 0)
        );
    }
}
