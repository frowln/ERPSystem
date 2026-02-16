package com.privod.platform.modules.revenueRecognition;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import com.privod.platform.modules.revenueRecognition.domain.RevenueContract;
import com.privod.platform.modules.revenueRecognition.repository.RevenueContractRepository;
import com.privod.platform.modules.revenueRecognition.service.RevenueContractService;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRevenueContractRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueContractResponse;
import com.privod.platform.modules.revenueRecognition.web.dto.UpdateRevenueContractRequest;
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
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RevenueContractServiceTest {

    @Mock
    private RevenueContractRepository revenueContractRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RevenueContractService revenueContractService;

    private UUID contractId;
    private UUID projectId;
    private UUID organizationId;
    private RevenueContract testContract;

    @BeforeEach
    void setUp() {
        contractId = UUID.randomUUID();
        projectId = UUID.randomUUID();
        organizationId = UUID.randomUUID();

        testContract = RevenueContract.builder()
                .projectId(projectId)
                .contractId(UUID.randomUUID())
                .contractName("Договор на строительство школы")
                .recognitionMethod(RecognitionMethod.PERCENTAGE_OF_COMPLETION)
                .recognitionStandard(RecognitionStandard.PBU_2_2008)
                .totalContractRevenue(new BigDecimal("10000000.00"))
                .totalEstimatedCost(new BigDecimal("8000000.00"))
                .organizationId(organizationId)
                .startDate(LocalDate.of(2025, 1, 1))
                .endDate(LocalDate.of(2025, 12, 31))
                .build();
        testContract.setId(contractId);
        testContract.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Revenue Contract")
    class CreateTests {

        @Test
        @DisplayName("Should create revenue contract with default method and standard")
        void createContract_DefaultMethodAndStandard() {
            CreateRevenueContractRequest request = new CreateRevenueContractRequest(
                    projectId, UUID.randomUUID(), "Новый договор",
                    null, null,
                    new BigDecimal("5000000.00"), new BigDecimal("4000000.00"),
                    organizationId, LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31));

            when(revenueContractRepository.save(any(RevenueContract.class))).thenAnswer(inv -> {
                RevenueContract c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            RevenueContractResponse response = revenueContractService.createContract(request);

            assertThat(response.recognitionMethod()).isEqualTo(RecognitionMethod.PERCENTAGE_OF_COMPLETION);
            assertThat(response.recognitionStandard()).isEqualTo(RecognitionStandard.PBU_2_2008);
            assertThat(response.totalContractRevenue()).isEqualByComparingTo(new BigDecimal("5000000.00"));
            assertThat(response.isActive()).isTrue();
            verify(auditService).logCreate(eq("RevenueContract"), any(UUID.class));
        }

        @Test
        @DisplayName("Should fail when end date is before start date")
        void createContract_InvalidDates() {
            CreateRevenueContractRequest request = new CreateRevenueContractRequest(
                    projectId, null, "Договор с ошибкой",
                    null, null,
                    new BigDecimal("5000000.00"), new BigDecimal("4000000.00"),
                    organizationId,
                    LocalDate.of(2025, 12, 31), LocalDate.of(2025, 1, 1));

            assertThatThrownBy(() -> revenueContractService.createContract(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Дата окончания должна быть позже даты начала");
        }

        @Test
        @DisplayName("Should detect loss contract when estimated cost exceeds revenue")
        void createContract_LossContractDetection() {
            CreateRevenueContractRequest request = new CreateRevenueContractRequest(
                    projectId, null, "Убыточный договор",
                    RecognitionMethod.PERCENTAGE_OF_COMPLETION, RecognitionStandard.PBU_2_2008,
                    new BigDecimal("5000000.00"), new BigDecimal("7000000.00"),
                    organizationId, null, null);

            when(revenueContractRepository.save(any(RevenueContract.class))).thenAnswer(inv -> {
                RevenueContract c = inv.getArgument(0);
                c.setId(UUID.randomUUID());
                c.setCreatedAt(Instant.now());
                return c;
            });

            RevenueContractResponse response = revenueContractService.createContract(request);

            assertThat(response.lossContract()).isTrue();
            assertThat(response.expectedLoss()).isEqualByComparingTo(new BigDecimal("2000000.00"));
            assertThat(response.expectedProfit()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("Update Revenue Contract")
    class UpdateTests {

        @Test
        @DisplayName("Should update contract estimated cost and recalculate profit/loss")
        void updateContract_RecalculateOnCostChange() {
            when(revenueContractRepository.findById(contractId)).thenReturn(Optional.of(testContract));
            when(revenueContractRepository.save(any(RevenueContract.class))).thenAnswer(inv -> inv.getArgument(0));

            // Increase cost to make it a loss contract
            UpdateRevenueContractRequest request = new UpdateRevenueContractRequest(
                    null, null, null, null, null,
                    new BigDecimal("12000000.00"),
                    null, null, null);

            RevenueContractResponse response = revenueContractService.updateContract(contractId, request);

            assertThat(response.totalEstimatedCost()).isEqualByComparingTo(new BigDecimal("12000000.00"));
            assertThat(response.lossContract()).isTrue();
            assertThat(response.expectedLoss()).isEqualByComparingTo(new BigDecimal("2000000.00"));
            verify(auditService).logUpdate("RevenueContract", contractId, "multiple", null, null);
        }
    }

    @Nested
    @DisplayName("Get / Delete Revenue Contract")
    class GetDeleteTests {

        @Test
        @DisplayName("Should find revenue contract by ID")
        void getContract_Success() {
            when(revenueContractRepository.findById(contractId)).thenReturn(Optional.of(testContract));

            RevenueContractResponse response = revenueContractService.getContract(contractId);

            assertThat(response).isNotNull();
            assertThat(response.contractName()).isEqualTo("Договор на строительство школы");
            assertThat(response.lossContract()).isFalse();
            assertThat(response.expectedProfit()).isEqualByComparingTo(new BigDecimal("2000000.00"));
        }

        @Test
        @DisplayName("Should throw when revenue contract not found")
        void getContract_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(revenueContractRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> revenueContractService.getContract(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Договор признания выручки не найден");
        }
    }
}
