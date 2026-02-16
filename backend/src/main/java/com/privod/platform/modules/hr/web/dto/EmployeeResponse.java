package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.domain.EmployeeStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EmployeeResponse(
        UUID id,
        UUID userId,
        String firstName,
        String lastName,
        String middleName,
        String fullName,
        String employeeNumber,
        String position,
        UUID departmentId,
        UUID organizationId,
        LocalDate hireDate,
        LocalDate terminationDate,
        EmployeeStatus status,
        String statusDisplayName,
        String phone,
        String email,
        String inn,
        String snils,
        BigDecimal hourlyRate,
        BigDecimal monthlyRate,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static EmployeeResponse fromEntity(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getUserId(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getMiddleName(),
                employee.getFullName(),
                employee.getEmployeeNumber(),
                employee.getPosition(),
                employee.getDepartmentId(),
                employee.getOrganizationId(),
                employee.getHireDate(),
                employee.getTerminationDate(),
                employee.getStatus(),
                employee.getStatus().getDisplayName(),
                employee.getPhone(),
                employee.getEmail(),
                employee.getInn(),
                employee.getSnils(),
                employee.getHourlyRate(),
                employee.getMonthlyRate(),
                employee.getNotes(),
                employee.getCreatedAt(),
                employee.getUpdatedAt(),
                employee.getCreatedBy()
        );
    }
}
