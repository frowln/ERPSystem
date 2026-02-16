package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.EmployeeStatus;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateEmployeeRequest(
        UUID userId,

        @Size(max = 255)
        String firstName,

        @Size(max = 255)
        String lastName,

        @Size(max = 255)
        String middleName,

        @Size(max = 200)
        String position,

        UUID departmentId,
        UUID organizationId,
        LocalDate hireDate,
        LocalDate terminationDate,
        EmployeeStatus status,
        String phone,
        String email,

        @Size(max = 20)
        String passportNumber,

        @Size(max = 12)
        String inn,

        @Size(max = 14)
        String snils,

        BigDecimal hourlyRate,
        BigDecimal monthlyRate,
        String notes
) {
}
