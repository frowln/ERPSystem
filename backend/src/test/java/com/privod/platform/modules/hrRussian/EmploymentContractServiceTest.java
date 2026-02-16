package com.privod.platform.modules.hrRussian;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hrRussian.domain.ContractStatus;
import com.privod.platform.modules.hrRussian.domain.ContractType;
import com.privod.platform.modules.hrRussian.domain.EmploymentContract;
import com.privod.platform.modules.hrRussian.domain.SalaryType;
import com.privod.platform.modules.hrRussian.repository.EmploymentContractRepository;
import com.privod.platform.modules.hrRussian.service.EmploymentContractService;
import com.privod.platform.modules.hrRussian.web.dto.CreateEmploymentContractRequest;
import com.privod.platform.modules.hrRussian.web.dto.EmploymentContractResponse;
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
class EmploymentContractServiceTest {

    @Mock
    private EmploymentContractRepository contractRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private EmploymentContractService contractService;

    private UUID contractId;
    private UUID employeeId;
    private EmploymentContract testContract;

    @BeforeEach
    void setUp() {
        contractId = UUID.randomUUID();
        employeeId = UUID.randomUUID();

        testContract = EmploymentContract.builder()
                .employeeId(employeeId)
                .contractNumber("ТД-2024-001")
                .contractType(ContractType.БЕССРОЧНЫЙ)
                .startDate(LocalDate.of(2024, 3, 1))
                .salary(new BigDecimal("80000.00"))
                .salaryType(SalaryType.ОКЛАД)
                .position("Инженер-строитель")
                .department("Строительный отдел")
                .workSchedule("5/2, 8 часов")
                .status(ContractStatus.ACTIVE)
                .build();
        testContract.setId(contractId);
        testContract.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Contract")
    class CreateContractTests {

        @Test
        @DisplayName("Should create contract with ACTIVE status")
        void createContract_SetsActiveStatus() {
            CreateEmploymentContractRequest request = new CreateEmploymentContractRequest(
                    employeeId, "ТД-2025-001", ContractType.БЕССРОЧНЫЙ,
                    LocalDate.of(2025, 1, 15), null,
                    new BigDecimal("90000.00"), SalaryType.ОКЛАД,
                    "Прораб", "Строительный отдел",
                    LocalDate.of(2025, 4, 15), "5/2, 8 часов");

            when(contractRepository.save(any(EmploymentContract.class))).thenAnswer(inv -> {
                EmploymentContract c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            EmploymentContractResponse response = contractService.createContract(request);

            assertThat(response.status()).isEqualTo(ContractStatus.ACTIVE);
            assertThat(response.contractNumber()).isEqualTo("ТД-2025-001");
            assertThat(response.contractTypeDisplayName()).isEqualTo("Бессрочный трудовой договор");
            assertThat(response.salary()).isEqualByComparingTo(new BigDecimal("90000.00"));
            verify(auditService).logCreate(eq("EmploymentContract"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create fixed-term contract with end date")
        void createContract_FixedTerm_HasEndDate() {
            CreateEmploymentContractRequest request = new CreateEmploymentContractRequest(
                    employeeId, "ТД-2025-002", ContractType.СРОЧНЫЙ,
                    LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31),
                    new BigDecimal("70000.00"), SalaryType.ОКЛАД,
                    "Рабочий", "Участок №3",
                    null, "Вахтовый метод");

            when(contractRepository.save(any(EmploymentContract.class))).thenAnswer(inv -> {
                EmploymentContract c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            EmploymentContractResponse response = contractService.createContract(request);

            assertThat(response.contractType()).isEqualTo(ContractType.СРОЧНЫЙ);
            assertThat(response.endDate()).isEqualTo(LocalDate.of(2025, 12, 31));
        }
    }

    @Nested
    @DisplayName("Terminate Contract")
    class TerminateContractTests {

        @Test
        @DisplayName("Should terminate active contract")
        void terminateContract_ActiveContract_Success() {
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
            when(contractRepository.save(any(EmploymentContract.class))).thenAnswer(inv -> inv.getArgument(0));

            EmploymentContractResponse response = contractService.terminateContract(contractId);

            assertThat(response.status()).isEqualTo(ContractStatus.TERMINATED);
            verify(auditService).logStatusChange("EmploymentContract", contractId,
                    ContractStatus.ACTIVE.name(), ContractStatus.TERMINATED.name());
        }

        @Test
        @DisplayName("Should throw when terminating already terminated contract")
        void terminateContract_AlreadyTerminated_Throws() {
            testContract.setStatus(ContractStatus.TERMINATED);
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            assertThatThrownBy(() -> contractService.terminateContract(contractId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Расторгнуть можно только действующий договор");
        }
    }

    @Nested
    @DisplayName("Get Contract")
    class GetContractTests {

        @Test
        @DisplayName("Should return contract by ID")
        void getContract_Success() {
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            EmploymentContractResponse response = contractService.getContract(contractId);

            assertThat(response).isNotNull();
            assertThat(response.contractNumber()).isEqualTo("ТД-2024-001");
            assertThat(response.salaryTypeDisplayName()).isEqualTo("Оклад (месячный)");
        }

        @Test
        @DisplayName("Should throw when contract not found")
        void getContract_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(contractRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> contractService.getContract(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Трудовой договор не найден");
        }

        @Test
        @DisplayName("Should return contracts by employee")
        void getByEmployee_ReturnsList() {
            when(contractRepository.findByEmployeeIdAndDeletedFalseOrderByStartDateDesc(employeeId))
                    .thenReturn(List.of(testContract));

            List<EmploymentContractResponse> result = contractService.getByEmployee(employeeId);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).employeeId()).isEqualTo(employeeId);
        }
    }
}
