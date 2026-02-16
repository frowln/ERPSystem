package com.privod.platform.modules.hr;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hr.domain.CertificateType;
import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.domain.EmployeeCertificate;
import com.privod.platform.modules.hr.domain.EmployeeStatus;
import com.privod.platform.modules.hr.repository.EmployeeCertificateRepository;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import com.privod.platform.modules.hr.service.EmployeeService;
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
    private Employee testEmployee;

    @BeforeEach
    void setUp() {
        employeeId = UUID.randomUUID();

        testEmployee = Employee.builder()
                .firstName("Иван")
                .lastName("Петров")
                .middleName("Сергеевич")
                .employeeNumber("EMP-00001")
                .position("Прораб")
                .organizationId(UUID.randomUUID())
                .hireDate(LocalDate.of(2024, 3, 15))
                .status(EmployeeStatus.ACTIVE)
                .hourlyRate(new BigDecimal("500.00"))
                .monthlyRate(new BigDecimal("80000.00"))
                .build();
        testEmployee.computeFullName();
        testEmployee.setId(employeeId);
        testEmployee.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Employee")
    class CreateEmployeeTests {

        @Test
        @DisplayName("Should create employee with ACTIVE status and generated number")
        void createEmployee_SetsDefaultActiveStatusAndGeneratesNumber() {
            CreateEmployeeRequest request = new CreateEmployeeRequest(
                    null, "Алексей", "Сидоров", "Петрович",
                    "Инженер", null, UUID.randomUUID(),
                    LocalDate.of(2025, 1, 10),
                    "+7-999-123-4567", "sidorov@company.ru",
                    null, "123456789012", "123-456-789 01",
                    new BigDecimal("600.00"), new BigDecimal("90000.00"), null);

            when(employeeRepository.getNextNumberSequence()).thenReturn(2L);
            when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
                Employee e = invocation.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });

            EmployeeResponse response = employeeService.createEmployee(request);

            assertThat(response.status()).isEqualTo(EmployeeStatus.ACTIVE);
            assertThat(response.fullName()).isEqualTo("Сидоров Алексей Петрович");
            assertThat(response.hourlyRate()).isEqualByComparingTo(new BigDecimal("600.00"));
            verify(auditService).logCreate(eq("Employee"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Update Employee")
    class UpdateEmployeeTests {

        @Test
        @DisplayName("Should update employee fields and recompute full name")
        void updateEmployee_UpdatesFieldsAndRecomputesFullName() {
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(testEmployee));
            when(employeeRepository.save(any(Employee.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateEmployeeRequest request = new UpdateEmployeeRequest(
                    null, "Иван", "Иванов", null,
                    "Главный инженер", null, null,
                    null, null, null,
                    null, null, null, null, null,
                    null, null, null);

            EmployeeResponse response = employeeService.updateEmployee(employeeId, request);

            assertThat(response.lastName()).isEqualTo("Иванов");
            assertThat(response.position()).isEqualTo("Главный инженер");
            assertThat(response.fullName()).isEqualTo("Иванов Иван Сергеевич");
            verify(auditService).logUpdate("Employee", employeeId, "multiple", null, null);
        }
    }

    @Nested
    @DisplayName("Get Employee")
    class GetEmployeeTests {

        @Test
        @DisplayName("Should find employee by ID")
        void getEmployee_Success() {
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(testEmployee));

            EmployeeResponse response = employeeService.getEmployee(employeeId);

            assertThat(response).isNotNull();
            assertThat(response.employeeNumber()).isEqualTo("EMP-00001");
            assertThat(response.fullName()).isEqualTo("Петров Иван Сергеевич");
        }

        @Test
        @DisplayName("Should throw when employee not found")
        void getEmployee_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(employeeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.getEmployee(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Сотрудник не найден");
        }
    }

    @Nested
    @DisplayName("Certificates")
    class CertificateTests {

        @Test
        @DisplayName("Should add certificate to employee")
        void addCertificate_Success() {
            when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(testEmployee));
            when(certificateRepository.save(any(EmployeeCertificate.class))).thenAnswer(invocation -> {
                EmployeeCertificate cert = invocation.getArgument(0);
                cert.setId(UUID.randomUUID());
                cert.setCreatedAt(Instant.now());
                return cert;
            });

            CreateCertificateRequest request = new CreateCertificateRequest(
                    CertificateType.SAFETY_HEIGHTS,
                    "Удостоверение работа на высоте",
                    "АБ-123456",
                    LocalDate.of(2024, 6, 1),
                    LocalDate.of(2027, 6, 1),
                    "ООО Учебный Центр",
                    null);

            CertificateResponse response = employeeService.addCertificate(employeeId, request);

            assertThat(response.certificateType()).isEqualTo(CertificateType.SAFETY_HEIGHTS);
            assertThat(response.name()).isEqualTo("Удостоверение работа на высоте");
            assertThat(response.expired()).isFalse();
            verify(auditService).logCreate(eq("EmployeeCertificate"), any(UUID.class));
        }

        @Test
        @DisplayName("Should return expired certificates")
        void getExpiredCertificates_ReturnsList() {
            EmployeeCertificate expiredCert = EmployeeCertificate.builder()
                    .employeeId(employeeId)
                    .certificateType(CertificateType.MEDICAL)
                    .name("Медосмотр")
                    .issuedDate(LocalDate.of(2023, 1, 1))
                    .expiryDate(LocalDate.of(2024, 1, 1))
                    .build();
            expiredCert.setId(UUID.randomUUID());
            expiredCert.setCreatedAt(Instant.now());

            when(certificateRepository.findExpiredCertificates()).thenReturn(List.of(expiredCert));

            List<CertificateResponse> result = employeeService.getExpiredCertificates();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).expired()).isTrue();
        }
    }
}
