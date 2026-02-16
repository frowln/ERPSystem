package com.privod.platform.modules.hr.service;

import com.privod.platform.infrastructure.audit.AuditService;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EmployeeCertificateRepository certificateRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private EmployeeService employeeService;

    private UUID employeeId;
    private UUID organizationId;
    private Employee testEmployee;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();
        organizationId = UUID.randomUUID();

        testEmployee = Employee.builder()
                .firstName("Ivan")
                .lastName("Petrov")
                .middleName("Sergeevich")
                .employeeNumber("EMP-00001")
                .position("Engineer")
                .organizationId(organizationId)
                .hireDate(LocalDate.of(2024, 1, 15))
                .status(EmployeeStatus.ACTIVE)
                .phone("+7-999-123-4567")
                .email("ipetrov@example.com")
                .hourlyRate(new BigDecimal("2500.00"))
                .monthlyRate(new BigDecimal("150000.00"))
                .build();
        testEmployee.setId(employeeId);
        testEmployee.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Employee")
    class CreateTests {

        @Test
        @DisplayName("Should create employee with ACTIVE status")
        void shouldCreate_withActiveStatus() {
            CreateEmployeeRequest request = new CreateEmployeeRequest(
                    null, "Alexey", "Sidorov", "Ivanovich",
                    "Developer", null, organizationId,
                    LocalDate.of(2025, 1, 1), "+7-999-000-0000",
                    "asidorov@example.com", null, null, null,
                    new BigDecimal("3000.00"), new BigDecimal("180000.00"), null);

            when(employeeRepository.getNextNumberSequence()).thenReturn(2L);
            when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
                Employee e = inv.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            EmployeeResponse response = employeeService.createEmployee(request);

            assertThat(response.status()).isEqualTo(EmployeeStatus.ACTIVE);
            assertThat(response.employeeNumber()).isEqualTo("EMP-00002");
            verify(auditService).logCreate(eq("Employee"), any(UUID.class));
        }

        @Test
        @DisplayName("Should default rates to ZERO when null")
        void shouldDefaultRates_whenNull() {
            CreateEmployeeRequest request = new CreateEmployeeRequest(
                    null, "Maria", "Ivanova", null,
                    "Manager", null, organizationId,
                    LocalDate.of(2025, 3, 1), null, null,
                    null, null, null, null, null, null);

            when(employeeRepository.getNextNumberSequence()).thenReturn(3L);
            when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> {
                Employee e = inv.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            EmployeeResponse response = employeeService.createEmployee(request);

            assertThat(response.hourlyRate()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(response.monthlyRate()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Update Employee")
    class UpdateTests {

        @Test
        @DisplayName("Should update employee position and rate")
        void shouldUpdate_whenValidInput() {
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(testEmployee));
            when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    null, null, null, null,
                    "Senior Engineer", null, null,
                    null, null, null, null, null,
                    null, null, null, new BigDecimal("3500.00"),
                    new BigDecimal("200000.00"), null);

            EmployeeResponse response = employeeService.updateEmployee(employeeId, request);

            assertThat(response.position()).isEqualTo("Senior Engineer");
            assertThat(response.hourlyRate()).isEqualByComparingTo(new BigDecimal("3500.00"));
            verify(auditService).logUpdate(eq("Employee"), eq(employeeId), any(), any(), any());
        }
    }

    @Nested
    @DisplayName("Certificates")
    class CertificateTests {

        @Test
        @DisplayName("Should add certificate to employee")
        void shouldAddCertificate() {
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(testEmployee));
            when(certificateRepository.save(any(EmployeeCertificate.class))).thenAnswer(inv -> {
                EmployeeCertificate cert = inv.getArgument(0);
                cert.setId(UUID.randomUUID());
                cert.setCreatedAt(Instant.now());
                return cert;
            });

            CreateCertificateRequest request = new CreateCertificateRequest(
                    "SAFETY", "Electrical Safety Certificate",
                    "CERT-12345", LocalDate.of(2024, 6, 1),
                    LocalDate.of(2025, 6, 1), "Safety Authority", null);

            CertificateResponse response = employeeService.addCertificate(employeeId, request);

            assertThat(response).isNotNull();
            verify(auditService).logCreate(eq("EmployeeCertificate"), any(UUID.class));
        }

        @Test
        @DisplayName("Should get employee certificates")
        void shouldReturnCertificates() {
            EmployeeCertificate cert = EmployeeCertificate.builder()
                    .employeeId(employeeId)
                    .name("Fire Safety")
                    .number("CERT-001")
                    .issuedDate(LocalDate.of(2024, 1, 1))
                    .expiryDate(LocalDate.of(2025, 1, 1))
                    .build();
            cert.setId(UUID.randomUUID());
            cert.setCreatedAt(Instant.now());

            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(testEmployee));
            when(certificateRepository.findByEmployeeIdAndDeletedFalseOrderByExpiryDateAsc(employeeId))
                    .thenReturn(List.of(cert));

            List<CertificateResponse> certs = employeeService.getEmployeeCertificates(employeeId);

            assertThat(certs).hasSize(1);
            assertThat(certs.get(0).name()).isEqualTo("Fire Safety");
        }

        @Test
        @DisplayName("Should soft-delete certificate")
        void shouldDeleteCertificate() {
            UUID certId = UUID.randomUUID();
            EmployeeCertificate cert = EmployeeCertificate.builder()
                    .employeeId(employeeId)
                    .name("To Delete")
                    .build();
            cert.setId(certId);
            cert.setCreatedAt(Instant.now());

            when(certificateRepository.findById(certId)).thenReturn(Optional.of(cert));
            when(certificateRepository.save(any(EmployeeCertificate.class))).thenAnswer(inv -> inv.getArgument(0));

            employeeService.deleteCertificate(certId);

            assertThat(cert.isDeleted()).isTrue();
            verify(auditService).logDelete("EmployeeCertificate", certId);
        }
    }

    @Test
    @DisplayName("Should find employee by ID")
    void shouldReturnEmployee_whenExists() {
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(testEmployee));

        EmployeeResponse response = employeeService.getEmployee(employeeId);

        assertThat(response).isNotNull();
        assertThat(response.employeeNumber()).isEqualTo("EMP-00001");
    }

    @Test
    @DisplayName("Should throw when employee not found")
    void shouldThrowException_whenNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(employeeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> employeeService.getEmployee(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Сотрудник не найден");
    }

    @Test
    @DisplayName("Should soft delete employee")
    void shouldSoftDelete_whenValidId() {
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(testEmployee));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

        employeeService.deleteEmployee(employeeId);

        assertThat(testEmployee.isDeleted()).isTrue();
        verify(auditService).logDelete("Employee", employeeId);
    }
}
