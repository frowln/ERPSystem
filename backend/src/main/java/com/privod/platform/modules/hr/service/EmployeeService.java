package com.privod.platform.modules.hr.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.domain.EmployeeCertificate;
import com.privod.platform.modules.hr.domain.EmployeeStatus;
import com.privod.platform.modules.hr.repository.EmployeeCertificateRepository;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import com.privod.platform.modules.hr.web.dto.CertificateResponse;
import com.privod.platform.modules.hr.web.dto.CreateCertificateRequest;
import com.privod.platform.modules.hr.web.dto.CreateEmployeeRequest;
import com.privod.platform.modules.hr.web.dto.EmployeeResponse;
import com.privod.platform.modules.hr.web.dto.UpdateEmployeeRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final EmployeeCertificateRepository certificateRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<EmployeeResponse> listEmployees(String search, EmployeeStatus status,
                                                 UUID organizationId, Pageable pageable) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (organizationId != null && !organizationId.equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot access employees for another organization");
        }

        Specification<Employee> spec = Specification.where(EmployeeSpecification.notDeleted())
                .and(EmployeeSpecification.hasStatus(status))
                .and(EmployeeSpecification.belongsToOrganization(currentOrgId))
                .and(EmployeeSpecification.searchByNameOrNumber(search));

        return employeeRepository.findAll(spec, pageable).map(EmployeeResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(UUID id) {
        Employee employee = getEmployeeOrThrow(id);
        return EmployeeResponse.fromEntity(employee);
    }

    @Transactional
    public EmployeeResponse createEmployee(CreateEmployeeRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot create employee in another organization");
        }

        String number = generateEmployeeNumber();

        Employee employee = Employee.builder()
                .userId(request.userId())
                .firstName(request.firstName())
                .lastName(request.lastName())
                .middleName(request.middleName())
                .employeeNumber(number)
                .position(request.position())
                .departmentId(request.departmentId())
                .organizationId(currentOrgId)
                .hireDate(request.hireDate())
                .status(EmployeeStatus.ACTIVE)
                .phone(request.phone())
                .email(request.email())
                .passportNumber(request.passportNumber())
                .inn(request.inn())
                .snils(request.snils())
                .hourlyRate(request.hourlyRate() != null ? request.hourlyRate() : java.math.BigDecimal.ZERO)
                .monthlyRate(request.monthlyRate() != null ? request.monthlyRate() : java.math.BigDecimal.ZERO)
                .notes(request.notes())
                .build();

        employee.computeFullName();
        employee = employeeRepository.save(employee);
        auditService.logCreate("Employee", employee.getId());

        log.info("Employee created: {} - {} ({})", employee.getEmployeeNumber(),
                employee.getFullName(), employee.getId());
        return EmployeeResponse.fromEntity(employee);
    }

    @Transactional
    public EmployeeResponse updateEmployee(UUID id, UpdateEmployeeRequest request) {
        Employee employee = getEmployeeOrThrow(id);
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();

        if (request.userId() != null) {
            employee.setUserId(request.userId());
        }
        if (request.firstName() != null) {
            employee.setFirstName(request.firstName());
        }
        if (request.lastName() != null) {
            employee.setLastName(request.lastName());
        }
        if (request.middleName() != null) {
            employee.setMiddleName(request.middleName());
        }
        if (request.position() != null) {
            employee.setPosition(request.position());
        }
        if (request.departmentId() != null) {
            employee.setDepartmentId(request.departmentId());
        }
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot move employee to another organization");
        }
        if (request.hireDate() != null) {
            employee.setHireDate(request.hireDate());
        }
        if (request.terminationDate() != null) {
            employee.setTerminationDate(request.terminationDate());
        }
        if (request.status() != null) {
            employee.setStatus(request.status());
        }
        if (request.phone() != null) {
            employee.setPhone(request.phone());
        }
        if (request.email() != null) {
            employee.setEmail(request.email());
        }
        if (request.passportNumber() != null) {
            employee.setPassportNumber(request.passportNumber());
        }
        if (request.inn() != null) {
            employee.setInn(request.inn());
        }
        if (request.snils() != null) {
            employee.setSnils(request.snils());
        }
        if (request.hourlyRate() != null) {
            employee.setHourlyRate(request.hourlyRate());
        }
        if (request.monthlyRate() != null) {
            employee.setMonthlyRate(request.monthlyRate());
        }
        if (request.notes() != null) {
            employee.setNotes(request.notes());
        }

        employee.computeFullName();
        employee = employeeRepository.save(employee);
        auditService.logUpdate("Employee", employee.getId(), "multiple", null, null);

        log.info("Employee updated: {} ({})", employee.getEmployeeNumber(), employee.getId());
        return EmployeeResponse.fromEntity(employee);
    }

    @Transactional
    public void deleteEmployee(UUID id) {
        Employee employee = getEmployeeOrThrow(id);
        employee.softDelete();
        employeeRepository.save(employee);
        auditService.logDelete("Employee", id);
        log.info("Employee soft-deleted: {} ({})", employee.getEmployeeNumber(), id);
    }

    @Transactional(readOnly = true)
    public List<EmployeeResponse> getByProject(UUID projectId) {
        return employeeRepository.findByProjectId(projectId)
                .stream()
                .map(EmployeeResponse::fromEntity)
                .toList();
    }

    // ---- Certificates ----

    @Transactional(readOnly = true)
    public List<CertificateResponse> getEmployeeCertificates(UUID employeeId) {
        getEmployeeOrThrow(employeeId);
        return certificateRepository.findByEmployeeIdAndDeletedFalseOrderByExpiryDateAsc(employeeId)
                .stream()
                .map(CertificateResponse::fromEntity)
                .toList();
    }

    @Transactional
    public CertificateResponse addCertificate(UUID employeeId, CreateCertificateRequest request) {
        getEmployeeOrThrow(employeeId);

        EmployeeCertificate cert = EmployeeCertificate.builder()
                .employeeId(employeeId)
                .certificateType(request.certificateType())
                .name(request.name())
                .number(request.number())
                .issuedDate(request.issuedDate())
                .expiryDate(request.expiryDate())
                .issuedBy(request.issuedBy())
                .notes(request.notes())
                .build();

        cert = certificateRepository.save(cert);
        auditService.logCreate("EmployeeCertificate", cert.getId());

        log.info("Certificate added for employee {}: {} ({})", employeeId, cert.getName(), cert.getId());
        return CertificateResponse.fromEntity(cert);
    }

    @Transactional
    public void deleteCertificate(UUID certificateId) {
        EmployeeCertificate cert = certificateRepository.findById(certificateId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сертификат не найден: " + certificateId));
        cert.softDelete();
        certificateRepository.save(cert);
        auditService.logDelete("EmployeeCertificate", certificateId);
        log.info("Certificate soft-deleted: {}", certificateId);
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> getExpiredCertificates() {
        return certificateRepository.findExpiredCertificates()
                .stream()
                .map(CertificateResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CertificateResponse> getExpiringCertificates(int daysAhead) {
        LocalDate deadline = LocalDate.now().plusDays(daysAhead);
        return certificateRepository.findExpiringCertificates(deadline)
                .stream()
                .map(CertificateResponse::fromEntity)
                .toList();
    }

    private Employee getEmployeeOrThrow(UUID id) {
        Employee employee = employeeRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сотрудник не найден: " + id));

        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (employee.getOrganizationId() == null || !employee.getOrganizationId().equals(currentOrgId)) {
            // Avoid leaking cross-tenant existence.
            throw new EntityNotFoundException("Сотрудник не найден: " + id);
        }

        return employee;
    }

    private String generateEmployeeNumber() {
        long seq = employeeRepository.getNextNumberSequence();
        return String.format("EMP-%05d", seq);
    }
}
