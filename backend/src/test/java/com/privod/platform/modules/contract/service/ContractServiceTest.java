package com.privod.platform.modules.contract.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.domain.ContractStatus;
import com.privod.platform.modules.contract.domain.ContractType;
import com.privod.platform.modules.contract.repository.ContractApprovalRepository;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.contract.repository.ContractTypeRepository;
import com.privod.platform.modules.contract.web.dto.ChangeContractStatusRequest;
import com.privod.platform.modules.contract.web.dto.ContractDashboardResponse;
import com.privod.platform.modules.contract.web.dto.ContractResponse;
import com.privod.platform.modules.contract.web.dto.CreateContractRequest;
import com.privod.platform.modules.contract.web.dto.UpdateContractRequest;
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
class ContractServiceTest {

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ContractTypeRepository contractTypeRepository;

    @Mock
    private ContractApprovalRepository contractApprovalRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ContractService contractService;

    private UUID contractId;
    private UUID projectId;
    private Contract testContract;

    @BeforeEach
    void setUp() {
        contractId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testContract = Contract.builder()
                .name("Construction Contract")
                .number("CTR-00001")
                .contractDate(LocalDate.of(2025, 1, 1))
                .partnerName("Builder LLC")
                .projectId(projectId)
                .status(ContractStatus.DRAFT)
                .amount(new BigDecimal("5000000.00"))
                .vatRate(new BigDecimal("20.00"))
                .vatAmount(new BigDecimal("1000000.00"))
                .totalWithVat(new BigDecimal("6000000.00"))
                .plannedStartDate(LocalDate.of(2025, 2, 1))
                .plannedEndDate(LocalDate.of(2025, 12, 31))
                .retentionPercent(BigDecimal.ZERO)
                .build();
        testContract.setId(contractId);
        testContract.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Contract")
    class CreateTests {

        @Test
        @DisplayName("Should create contract with DRAFT status and calculated VAT")
        void shouldCreate_withDraftStatusAndVat() {
            CreateContractRequest request = new CreateContractRequest(
                    "New Contract", LocalDate.of(2025, 3, 1),
                    null, "Partner Inc.", projectId, null,
                    new BigDecimal("1000000.00"), null,
                    "Net 30", LocalDate.of(2025, 4, 1),
                    LocalDate.of(2025, 9, 30), null, null, "Notes");

            when(contractRepository.getNextNumberSequence()).thenReturn(2L);
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> {
                Contract c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            ContractResponse response = contractService.createContract(request);

            assertThat(response.status()).isEqualTo(ContractStatus.DRAFT);
            assertThat(response.vatRate()).isEqualByComparingTo(new BigDecimal("20.00"));
            assertThat(response.number()).isEqualTo("CTR-00002");
            verify(auditService).logCreate(eq("Contract"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject when end date is before start date")
        void shouldThrowException_whenInvalidDates() {
            CreateContractRequest request = new CreateContractRequest(
                    "Bad Dates", LocalDate.now(), null, "Partner",
                    projectId, null, null, null, null,
                    LocalDate.of(2025, 12, 31), LocalDate.of(2025, 1, 1),
                    null, null, null);

            assertThatThrownBy(() -> contractService.createContract(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Дата окончания");
        }
    }

    @Nested
    @DisplayName("Update Contract")
    class UpdateTests {

        @Test
        @DisplayName("Should update contract in DRAFT status")
        void shouldUpdate_whenDraftStatus() {
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateContractRequest request = new UpdateContractRequest(
                    "Updated Contract", null, null, null,
                    null, null, new BigDecimal("7000000.00"), null,
                    null, null, null, null, null,
                    null, null, "Updated notes");

            ContractResponse response = contractService.updateContract(contractId, request);

            assertThat(response.name()).isEqualTo("Updated Contract");
            verify(auditService).logUpdate(eq("Contract"), eq(contractId), any(), any(), any());
        }

        @Test
        @DisplayName("Should reject update when contract is ACTIVE")
        void shouldThrowException_whenActive() {
            testContract.setStatus(ContractStatus.ACTIVE);
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            UpdateContractRequest request = new UpdateContractRequest(
                    "Fail", null, null, null, null, null,
                    null, null, null, null, null, null,
                    null, null, null, null);

            assertThatThrownBy(() -> contractService.updateContract(contractId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Черновик");
        }

        @Test
        @DisplayName("Should allow update when contract is REJECTED")
        void shouldAllow_whenRejected() {
            testContract.setStatus(ContractStatus.REJECTED);
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateContractRequest request = new UpdateContractRequest(
                    "Fixed Contract", null, null, null, null, null,
                    null, null, null, null, null, null,
                    null, null, null, null);

            ContractResponse response = contractService.updateContract(contractId, request);

            assertThat(response.name()).isEqualTo("Fixed Contract");
        }
    }

    @Nested
    @DisplayName("Contract Lifecycle")
    class LifecycleTests {

        @Test
        @DisplayName("Should sign contract from APPROVED")
        void shouldSign_whenApproved() {
            testContract.setStatus(ContractStatus.APPROVED);
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

            ContractResponse response = contractService.signContract(contractId);

            assertThat(response.status()).isEqualTo(ContractStatus.SIGNED);
            verify(auditService).logStatusChange("Contract", contractId, "APPROVED", "SIGNED");
        }

        @Test
        @DisplayName("Should reject sign when not APPROVED")
        void shouldThrowException_whenSignFromNonApproved() {
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            assertThatThrownBy(() -> contractService.signContract(contractId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("согласованный");
        }

        @Test
        @DisplayName("Should activate contract from SIGNED")
        void shouldActivate_whenSigned() {
            testContract.setStatus(ContractStatus.SIGNED);
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

            ContractResponse response = contractService.activateContract(contractId);

            assertThat(response.status()).isEqualTo(ContractStatus.ACTIVE);
            verify(auditService).logStatusChange("Contract", contractId, "SIGNED", "ACTIVE");
        }

        @Test
        @DisplayName("Should close contract from ACTIVE")
        void shouldClose_whenActive() {
            testContract.setStatus(ContractStatus.ACTIVE);
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

            ContractResponse response = contractService.closeContract(contractId);

            assertThat(response.status()).isEqualTo(ContractStatus.CLOSED);
        }
    }

    @Test
    @DisplayName("Should create new contract version")
    void shouldCreateVersion() {
        testContract.setDocVersion(1);
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> {
            Contract c = inv.getArgument(0);
            c.setId(UUID.randomUUID());
            c.setCreatedAt(Instant.now());
            return c;
        });

        ContractResponse response = contractService.createVersion(contractId, "Price adjustment");

        assertThat(response.status()).isEqualTo(ContractStatus.DRAFT);
        assertThat(response.docVersion()).isEqualTo(2);
        verify(auditService).logCreate(eq("Contract"), any(UUID.class));
    }

    @Test
    @DisplayName("Should throw when contract not found")
    void shouldThrowException_whenNotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(contractRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contractService.getContract(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Договор не найден");
    }

    @Test
    @DisplayName("Should return dashboard summary")
    void shouldReturnDashboard() {
        when(contractRepository.countActiveContracts(projectId)).thenReturn(8L);
        when(contractRepository.countByStatusAndProjectId(projectId)).thenReturn(List.of(
                new Object[]{ContractStatus.ACTIVE, 5L},
                new Object[]{ContractStatus.DRAFT, 3L}
        ));
        when(contractRepository.sumTotalAmount(projectId)).thenReturn(new BigDecimal("25000000.00"));

        ContractDashboardResponse dashboard = contractService.getDashboardSummary(projectId);

        assertThat(dashboard.totalContracts()).isEqualTo(8L);
        assertThat(dashboard.totalAmount()).isEqualByComparingTo(new BigDecimal("25000000.00"));
    }
}
