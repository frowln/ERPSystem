package com.privod.platform.modules.contract;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.contract.domain.ApprovalStatus;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.domain.ContractApproval;
import com.privod.platform.modules.contract.domain.ContractStatus;
import com.privod.platform.modules.contract.domain.ContractType;
import com.privod.platform.modules.contract.repository.ContractApprovalRepository;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.contract.repository.ContractTypeRepository;
import com.privod.platform.modules.contract.service.ContractService;
import com.privod.platform.modules.contract.web.dto.ApproveContractRequest;
import com.privod.platform.modules.contract.web.dto.ChangeContractStatusRequest;
import com.privod.platform.modules.contract.web.dto.ContractDashboardResponse;
import com.privod.platform.modules.contract.web.dto.ContractResponse;
import com.privod.platform.modules.contract.web.dto.CreateContractRequest;
import com.privod.platform.modules.contract.web.dto.RejectContractRequest;
import com.privod.platform.modules.contract.web.dto.UpdateContractRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
import static org.mockito.Mockito.never;
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
    private UUID typeId;
    private Contract testContract;
    private ContractType testContractType;

    @BeforeEach
    void setUp() {
        contractId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        typeId = UUID.randomUUID();

        testContract = Contract.builder()
                .name("Договор на строительство")
                .number("CTR-00001")
                .contractDate(LocalDate.of(2025, 1, 15))
                .partnerId(UUID.randomUUID())
                .partnerName("ООО СтройМонтаж")
                .projectId(projectId)
                .typeId(typeId)
                .status(ContractStatus.DRAFT)
                .amount(new BigDecimal("5000000.00"))
                .vatRate(new BigDecimal("20.00"))
                .vatAmount(new BigDecimal("1000000.00"))
                .totalWithVat(new BigDecimal("6000000.00"))
                .plannedStartDate(LocalDate.of(2025, 2, 1))
                .plannedEndDate(LocalDate.of(2025, 12, 31))
                .responsibleId(UUID.randomUUID())
                .build();
        testContract.setId(contractId);
        testContract.setCreatedAt(Instant.now());

        testContractType = ContractType.builder()
                .code("GENERAL")
                .name("Генеральный подряд")
                .requiresLawyerApproval(true)
                .requiresManagementApproval(true)
                .requiresFinanceApproval(true)
                .build();
        testContractType.setId(typeId);
    }

    @Nested
    @DisplayName("Create Contract")
    class CreateContractTests {

        @Test
        @DisplayName("Should create contract with DRAFT status and calculated VAT")
        void createContract_SetsDefaultDraftStatusAndCalculatesVat() {
            CreateContractRequest request = new CreateContractRequest(
                    "Новый договор", LocalDate.of(2025, 3, 1),
                    UUID.randomUUID(), "ООО Подрядчик", projectId, typeId,
                    new BigDecimal("10000000.00"), new BigDecimal("20.00"),
                    "30 дней после подписания акта",
                    LocalDate.of(2025, 4, 1), LocalDate.of(2025, 12, 31),
                    UUID.randomUUID(), new BigDecimal("5.00"), null);

            when(contractRepository.getNextNumberSequence()).thenReturn(1L);
            when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
                Contract c = invocation.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            ContractResponse response = contractService.createContract(request);

            assertThat(response.status()).isEqualTo(ContractStatus.DRAFT);
            assertThat(response.vatAmount()).isEqualByComparingTo(new BigDecimal("2000000.00"));
            assertThat(response.totalWithVat()).isEqualByComparingTo(new BigDecimal("12000000.00"));
            verify(auditService).logCreate(eq("Contract"), any(UUID.class));
        }

        @Test
        @DisplayName("Should fail when end date is before start date")
        void createContract_InvalidDates() {
            CreateContractRequest request = new CreateContractRequest(
                    "Договор с ошибкой", null,
                    null, null, null, null,
                    null, null, null,
                    LocalDate.of(2025, 12, 31), LocalDate.of(2025, 1, 1),
                    null, null, null);

            assertThatThrownBy(() -> contractService.createContract(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Дата окончания должна быть позже даты начала");
        }
    }

    @Nested
    @DisplayName("Update Contract")
    class UpdateContractTests {

        @Test
        @DisplayName("Should update contract in DRAFT status")
        void updateContract_DraftStatus() {
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateContractRequest request = new UpdateContractRequest(
                    "Обновлённый договор", null, null, null, null, null,
                    new BigDecimal("7000000.00"), null, null,
                    null, null, null, null, null, null, null);

            ContractResponse response = contractService.updateContract(contractId, request);

            assertThat(response.name()).isEqualTo("Обновлённый договор");
            assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("7000000.00"));
            verify(auditService).logUpdate("Contract", contractId, "multiple", null, null);
        }

        @Test
        @DisplayName("Should reject update when contract is not in editable status")
        void updateContract_NonEditableStatus() {
            testContract.setStatus(ContractStatus.ACTIVE);
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            UpdateContractRequest request = new UpdateContractRequest(
                    "Попытка обновления", null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null);

            assertThatThrownBy(() -> contractService.updateContract(contractId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Редактирование договора возможно только");
        }
    }

    @Nested
    @DisplayName("Change Status")
    class ChangeStatusTests {

        @Test
        @DisplayName("Should allow valid status transition DRAFT -> CANCELLED")
        void changeStatus_ValidTransition() {
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

            ChangeContractStatusRequest request = new ChangeContractStatusRequest(
                    ContractStatus.CANCELLED, "Отменён по решению заказчика");
            ContractResponse response = contractService.changeStatus(contractId, request);

            assertThat(response.status()).isEqualTo(ContractStatus.CANCELLED);
            assertThat(response.rejectionReason()).isEqualTo("Отменён по решению заказчика");
            verify(auditService).logStatusChange("Contract", contractId, "DRAFT", "CANCELLED");
        }

        @Test
        @DisplayName("Should reject invalid status transition DRAFT -> ACTIVE")
        void changeStatus_InvalidTransition() {
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            ChangeContractStatusRequest request = new ChangeContractStatusRequest(
                    ContractStatus.ACTIVE, null);

            assertThatThrownBy(() -> contractService.changeStatus(contractId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести договор");
        }
    }

    @Nested
    @DisplayName("Submit for Approval")
    class SubmitForApprovalTests {

        @Test
        @DisplayName("Should create approval records and change status to ON_APPROVAL")
        void submitForApproval_CreatesApprovalsAndChangesStatus() {
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
            when(contractTypeRepository.findById(typeId)).thenReturn(Optional.of(testContractType));
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));
            when(contractApprovalRepository.save(any(ContractApproval.class))).thenAnswer(inv -> {
                ContractApproval a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            ContractResponse response = contractService.submitForApproval(contractId);

            assertThat(response.status()).isEqualTo(ContractStatus.ON_APPROVAL);

            ArgumentCaptor<ContractApproval> captor = ArgumentCaptor.forClass(ContractApproval.class);
            verify(contractApprovalRepository, org.mockito.Mockito.times(3)).save(captor.capture());

            List<ContractApproval> approvals = captor.getAllValues();
            assertThat(approvals).hasSize(3);
            assertThat(approvals.stream().map(ContractApproval::getStage).toList())
                    .containsExactly("lawyer", "management", "finance");
            assertThat(approvals).allMatch(a -> a.getStatus() == ApprovalStatus.PENDING);
        }

        @Test
        @DisplayName("Should reject submission when contract is not in DRAFT or REJECTED status")
        void submitForApproval_InvalidStatus() {
            testContract.setStatus(ContractStatus.ACTIVE);
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            assertThatThrownBy(() -> contractService.submitForApproval(contractId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Отправить на согласование можно только");
        }
    }

    @Nested
    @DisplayName("Approve Contract")
    class ApproveContractTests {

        @Test
        @DisplayName("Should approve contract at lawyer stage")
        void approveContract_LawyerStage() {
            testContract.setStatus(ContractStatus.ON_APPROVAL);
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            ContractApproval lawyerApproval = ContractApproval.builder()
                    .contractId(contractId)
                    .stage("lawyer")
                    .status(ApprovalStatus.PENDING)
                    .build();
            lawyerApproval.setId(UUID.randomUUID());

            when(contractApprovalRepository.findByContractIdAndStage(contractId, "lawyer"))
                    .thenReturn(Optional.of(lawyerApproval));

            // Other stages still pending
            ContractApproval mgmtApproval = ContractApproval.builder()
                    .contractId(contractId).stage("management").status(ApprovalStatus.PENDING).build();
            ContractApproval finApproval = ContractApproval.builder()
                    .contractId(contractId).stage("finance").status(ApprovalStatus.PENDING).build();

            when(contractApprovalRepository.findByContractIdOrderByCreatedAtAsc(contractId))
                    .thenReturn(List.of(lawyerApproval, mgmtApproval, finApproval));
            when(contractApprovalRepository.findByContractIdAndStage(contractId, "management"))
                    .thenReturn(Optional.of(mgmtApproval));
            when(contractApprovalRepository.save(any(ContractApproval.class))).thenAnswer(inv -> inv.getArgument(0));
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

            ApproveContractRequest request = new ApproveContractRequest("lawyer", "Юридически корректен");
            ContractResponse response = contractService.approveContract(contractId, request);

            assertThat(response.status()).isEqualTo(ContractStatus.LAWYER_APPROVED);
            assertThat(lawyerApproval.getStatus()).isEqualTo(ApprovalStatus.APPROVED);
            assertThat(lawyerApproval.getApprovedAt()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Reject Contract")
    class RejectContractTests {

        @Test
        @DisplayName("Should reject contract and set rejection reason")
        void rejectContract_SetsReasonAndStatus() {
            testContract.setStatus(ContractStatus.ON_APPROVAL);
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            ContractApproval lawyerApproval = ContractApproval.builder()
                    .contractId(contractId)
                    .stage("lawyer")
                    .status(ApprovalStatus.PENDING)
                    .build();
            lawyerApproval.setId(UUID.randomUUID());

            when(contractApprovalRepository.findByContractIdAndStage(contractId, "lawyer"))
                    .thenReturn(Optional.of(lawyerApproval));
            when(contractApprovalRepository.save(any(ContractApproval.class))).thenAnswer(inv -> inv.getArgument(0));
            when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

            RejectContractRequest request = new RejectContractRequest("lawyer", "Отсутствует приложение к договору");
            ContractResponse response = contractService.rejectContract(contractId, request);

            assertThat(response.status()).isEqualTo(ContractStatus.REJECTED);
            assertThat(response.rejectionReason()).isEqualTo("Отсутствует приложение к договору");
            assertThat(lawyerApproval.getStatus()).isEqualTo(ApprovalStatus.REJECTED);
            assertThat(lawyerApproval.getRejectedAt()).isNotNull();
            verify(auditService).logStatusChange("Contract", contractId, "ON_APPROVAL", "REJECTED");
        }

        @Test
        @DisplayName("Should reject when contract is not in approval status")
        void rejectContract_InvalidStatus() {
            testContract.setStatus(ContractStatus.DRAFT);
            when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            RejectContractRequest request = new RejectContractRequest("lawyer", "Причина");

            assertThatThrownBy(() -> contractService.rejectContract(contractId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Договор не находится на этапе согласования");
        }
    }

    @Nested
    @DisplayName("Dashboard Summary")
    class DashboardSummaryTests {

        @Test
        @DisplayName("Should return contract dashboard summary")
        void getDashboardSummary_ReturnsStats() {
            when(contractRepository.countActiveContracts(projectId)).thenReturn(5L);
            when(contractRepository.countByStatusAndProjectId(projectId))
                    .thenReturn(List.of(
                            new Object[]{ContractStatus.DRAFT, 2L},
                            new Object[]{ContractStatus.ACTIVE, 3L}
                    ));
            when(contractRepository.sumTotalAmount(projectId))
                    .thenReturn(new BigDecimal("15000000.00"));

            ContractDashboardResponse response = contractService.getDashboardSummary(projectId);

            assertThat(response.totalContracts()).isEqualTo(5L);
            assertThat(response.statusCounts()).containsEntry("DRAFT", 2L);
            assertThat(response.statusCounts()).containsEntry("ACTIVE", 3L);
            assertThat(response.totalAmount()).isEqualByComparingTo(new BigDecimal("15000000.00"));
        }
    }

    @Test
    @DisplayName("Should find contract by ID")
    void getContract_Success() {
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

        ContractResponse response = contractService.getContract(contractId);

        assertThat(response).isNotNull();
        assertThat(response.number()).isEqualTo("CTR-00001");
        assertThat(response.name()).isEqualTo("Договор на строительство");
    }

    @Test
    @DisplayName("Should throw when contract not found by ID")
    void getContract_NotFound() {
        UUID nonExistentId = UUID.randomUUID();
        when(contractRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> contractService.getContract(nonExistentId))
                .isInstanceOf(EntityNotFoundException.class)
                .hasMessageContaining("Договор не найден");
    }

    @Test
    @DisplayName("Should sign an approved contract")
    void signContract_Success() {
        testContract.setStatus(ContractStatus.APPROVED);
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

        ContractResponse response = contractService.signContract(contractId);

        assertThat(response.status()).isEqualTo(ContractStatus.SIGNED);
        verify(auditService).logStatusChange("Contract", contractId, "APPROVED", "SIGNED");
    }

    @Test
    @DisplayName("Should activate a signed contract and set actual start date")
    void activateContract_Success() {
        testContract.setStatus(ContractStatus.SIGNED);
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

        ContractResponse response = contractService.activateContract(contractId);

        assertThat(response.status()).isEqualTo(ContractStatus.ACTIVE);
        assertThat(response.actualStartDate()).isEqualTo(LocalDate.now());
        verify(auditService).logStatusChange("Contract", contractId, "SIGNED", "ACTIVE");
    }

    @Test
    @DisplayName("Should close an active contract and set actual end date")
    void closeContract_Success() {
        testContract.setStatus(ContractStatus.ACTIVE);
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(inv -> inv.getArgument(0));

        ContractResponse response = contractService.closeContract(contractId);

        assertThat(response.status()).isEqualTo(ContractStatus.CLOSED);
        assertThat(response.actualEndDate()).isEqualTo(LocalDate.now());
        verify(auditService).logStatusChange("Contract", contractId, "ACTIVE", "CLOSED");
    }

    @Test
    @DisplayName("Should create a new version of contract")
    void createVersion_Success() {
        when(contractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(invocation -> {
            Contract c = invocation.getArgument(0);
            c.setId(UUID.randomUUID());
            c.setCreatedAt(Instant.now());
            return c;
        });

        ContractResponse response = contractService.createVersion(contractId, "Корректировка суммы");

        assertThat(response.docVersion()).isEqualTo(2);
        assertThat(response.versionComment()).isEqualTo("Корректировка суммы");
        assertThat(response.parentVersionId()).isEqualTo(contractId);
        assertThat(response.status()).isEqualTo(ContractStatus.DRAFT);
        verify(auditService).logCreate(eq("Contract"), any(UUID.class));
    }
}
