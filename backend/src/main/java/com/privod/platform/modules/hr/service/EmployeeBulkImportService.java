package com.privod.platform.modules.hr.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.domain.EmployeeStatus;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import com.privod.platform.modules.hr.web.dto.BulkImportResult;
import com.privod.platform.modules.hr.web.dto.EmployeeImportRow;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeBulkImportService {

    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    @Transactional
    public BulkImportResult bulkImport(List<EmployeeImportRow> rows) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        BulkImportResult result = BulkImportResult.builder()
                .total(rows.size())
                .created(0)
                .skipped(0)
                .failed(0)
                .build();

        for (int i = 0; i < rows.size(); i++) {
            EmployeeImportRow row = rows.get(i);
            int rowNumber = i + 1;

            try {
                // Validate required fields
                if (isBlank(row.getLastName())) {
                    result.addError("Строка " + rowNumber + ": Фамилия обязательна");
                    result.setFailed(result.getFailed() + 1);
                    continue;
                }
                if (isBlank(row.getFirstName())) {
                    result.addError("Строка " + rowNumber + ": Имя обязательно");
                    result.setFailed(result.getFailed() + 1);
                    continue;
                }
                if (isBlank(row.getPosition())) {
                    result.addError("Строка " + rowNumber + ": Должность обязательна");
                    result.setFailed(result.getFailed() + 1);
                    continue;
                }

                // Validate INN format if provided
                if (!isBlank(row.getInn())) {
                    String cleanInn = row.getInn().replaceAll("\\D", "");
                    if (cleanInn.length() != 10 && cleanInn.length() != 12) {
                        result.addError("Строка " + rowNumber + ": Неверный формат ИНН (" + row.getInn() + ")");
                        result.setFailed(result.getFailed() + 1);
                        continue;
                    }
                }

                // Generate employee number
                long seq = employeeRepository.getNextNumberSequence();
                String empNumber = String.format("EMP-%05d", seq);

                // Use provided personnel number if available
                if (!isBlank(row.getPersonnelNumber())) {
                    empNumber = row.getPersonnelNumber().trim();
                }

                Employee employee = Employee.builder()
                        .firstName(row.getFirstName().trim())
                        .lastName(row.getLastName().trim())
                        .middleName(isBlank(row.getMiddleName()) ? null : row.getMiddleName().trim())
                        .position(row.getPosition().trim())
                        .employeeNumber(empNumber)
                        .organizationId(orgId)
                        .hireDate(LocalDate.now())
                        .status(EmployeeStatus.ACTIVE)
                        .phone(isBlank(row.getPhone()) ? null : row.getPhone().trim())
                        .email(isBlank(row.getEmail()) ? null : row.getEmail().trim())
                        .inn(isBlank(row.getInn()) ? null : row.getInn().replaceAll("\\D", ""))
                        .snils(isBlank(row.getSnils()) ? null : row.getSnils().replaceAll("\\D", ""))
                        .build();

                employee.computeFullName();
                employee = employeeRepository.save(employee);
                auditService.logCreate("Employee", employee.getId());

                result.setCreated(result.getCreated() + 1);
                log.debug("Bulk import: created employee {} - {} (row {})",
                        employee.getEmployeeNumber(), employee.getFullName(), rowNumber);

            } catch (Exception e) {
                String msg = "Строка " + rowNumber + ": " + e.getMessage();
                result.addError(msg);
                result.setFailed(result.getFailed() + 1);
                log.warn("Bulk import error at row {}: {}", rowNumber, e.getMessage());
            }
        }

        log.info("Bulk import completed: total={}, created={}, failed={}, skipped={}",
                result.getTotal(), result.getCreated(), result.getFailed(), result.getSkipped());

        return result;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
