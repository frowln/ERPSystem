package com.privod.platform.modules.revenueRecognition;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.revenueRecognition.domain.PeriodStatus;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import com.privod.platform.modules.revenueRecognition.domain.RevenueContract;
import com.privod.platform.modules.revenueRecognition.domain.RevenueRecognitionPeriod;
import com.privod.platform.modules.revenueRecognition.repository.RevenueRecognitionPeriodRepository;
import com.privod.platform.modules.revenueRecognition.service.RevenueContractService;
import com.privod.platform.modules.revenueRecognition.service.RevenueRecognitionPeriodService;
import com.privod.platform.modules.revenueRecognition.web.dto.CalculatePeriodRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.ChangePeriodStatusRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRecognitionPeriodRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueRecognitionPeriodResponse;
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
class RevenueRecognitionPeriodServiceTest {

    @Mock
    private RevenueRecognitionPeriodRepository periodRepository;

    @Mock
    private RevenueContractService revenueContractService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RevenueRecognitionPeriodService periodService;

    private UUID periodId;
    private UUID revenueContractId;
    private RevenueContract testContract;
    private RevenueRecognitionPeriod testPeriod;

    @BeforeEach
    void setUp() {
        periodId = UUID.randomUUID();
        revenueContractId = UUID.randomUUID();

        testContract = RevenueContract.builder()
                .projectId(UUID.randomUUID())
                .contractName("Договор ГП-2025")
                .recognitionMethod(RecognitionMethod.PERCENTAGE_OF_COMPLETION)
                .recognitionStandard(RecognitionStandard.PBU_2_2008)
                .totalContractRevenue(new BigDecimal("10000000.00"))
                .totalEstimatedCost(new BigDecimal("8000000.00"))
                .organizationId(UUID.randomUUID())
                .build();
        testContract.setId(revenueContractId);
        testContract.setCreatedAt(Instant.now());

        testPeriod = RevenueRecognitionPeriod.builder()
                .revenueContractId(revenueContractId)
                .periodStart(LocalDate.of(2025, 1, 1))
                .periodEnd(LocalDate.of(2025, 3, 31))
                .status(PeriodStatus.OPEN)
                .build();
        testPeriod.setId(periodId);
        testPeriod.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Calculate Period - ПБУ 2/2008 Percent Complete")
    class CalculatePeriodTests {

        @Test
        @DisplayName("Should calculate percent complete = cumulativeCost / totalEstimatedCost * 100")
        void calculatePeriod_PercentComplete() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(revenueContractService.getContractOrThrow(revenueContractId)).thenReturn(testContract);
            when(periodRepository.findPreviousPeriod(eq(revenueContractId), any())).thenReturn(Optional.empty());
            when(periodRepository.save(any(RevenueRecognitionPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

            // CumulativeCost = 2,400,000 / TotalEstimated = 8,000,000 => 30%
            CalculatePeriodRequest request = new CalculatePeriodRequest(
                    new BigDecimal("2400000.00"), UUID.randomUUID());

            RevenueRecognitionPeriodResponse response = periodService.calculatePeriod(periodId, request);

            assertThat(response.percentComplete()).isEqualByComparingTo(new BigDecimal("30.0000"));
            assertThat(response.status()).isEqualTo(PeriodStatus.CALCULATED);
        }

        @Test
        @DisplayName("Should calculate cumulative revenue = totalRevenue * (cumulativeCost / totalEstimatedCost)")
        void calculatePeriod_CumulativeRevenue() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(revenueContractService.getContractOrThrow(revenueContractId)).thenReturn(testContract);
            when(periodRepository.findPreviousPeriod(eq(revenueContractId), any())).thenReturn(Optional.empty());
            when(periodRepository.save(any(RevenueRecognitionPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

            // Revenue = 10,000,000 * (2,400,000 / 8,000,000) = 3,000,000
            CalculatePeriodRequest request = new CalculatePeriodRequest(
                    new BigDecimal("2400000.00"), UUID.randomUUID());

            RevenueRecognitionPeriodResponse response = periodService.calculatePeriod(periodId, request);

            assertThat(response.cumulativeRevenueRecognized()).isEqualByComparingTo(new BigDecimal("3000000.00"));
            assertThat(response.cumulativeCostIncurred()).isEqualByComparingTo(new BigDecimal("2400000.00"));
        }

        @Test
        @DisplayName("Should calculate period revenue as difference from previous cumulative")
        void calculatePeriod_PeriodRevenueDelta() {
            // Set up previous period
            RevenueRecognitionPeriod previousPeriod = RevenueRecognitionPeriod.builder()
                    .revenueContractId(revenueContractId)
                    .periodStart(LocalDate.of(2024, 10, 1))
                    .periodEnd(LocalDate.of(2024, 12, 31))
                    .status(PeriodStatus.POSTED)
                    .cumulativeCostIncurred(new BigDecimal("1600000.00"))
                    .cumulativeRevenueRecognized(new BigDecimal("2000000.00"))
                    .build();
            previousPeriod.setId(UUID.randomUUID());

            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(revenueContractService.getContractOrThrow(revenueContractId)).thenReturn(testContract);
            when(periodRepository.findPreviousPeriod(eq(revenueContractId), any()))
                    .thenReturn(Optional.of(previousPeriod));
            when(periodRepository.save(any(RevenueRecognitionPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

            // Current cumulative cost = 4,000,000 => cumulative revenue = 10M * (4M/8M) = 5,000,000
            // Period revenue = 5,000,000 - 2,000,000 = 3,000,000
            // Period cost = 4,000,000 - 1,600,000 = 2,400,000
            CalculatePeriodRequest request = new CalculatePeriodRequest(
                    new BigDecimal("4000000.00"), UUID.randomUUID());

            RevenueRecognitionPeriodResponse response = periodService.calculatePeriod(periodId, request);

            assertThat(response.periodRevenueRecognized()).isEqualByComparingTo(new BigDecimal("3000000.00"));
            assertThat(response.periodCostIncurred()).isEqualByComparingTo(new BigDecimal("2400000.00"));
            assertThat(response.percentComplete()).isEqualByComparingTo(new BigDecimal("50.0000"));
        }

        @Test
        @DisplayName("Should recognize expected loss immediately when contract is loss-making")
        void calculatePeriod_LossProvision() {
            // Make contract loss-making: estimated cost > revenue
            RevenueContract lossContract = RevenueContract.builder()
                    .projectId(UUID.randomUUID())
                    .contractName("Убыточный договор")
                    .recognitionMethod(RecognitionMethod.PERCENTAGE_OF_COMPLETION)
                    .recognitionStandard(RecognitionStandard.PBU_2_2008)
                    .totalContractRevenue(new BigDecimal("5000000.00"))
                    .totalEstimatedCost(new BigDecimal("7000000.00"))
                    .organizationId(UUID.randomUUID())
                    .build();
            lossContract.setId(revenueContractId);

            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(revenueContractService.getContractOrThrow(revenueContractId)).thenReturn(lossContract);
            when(periodRepository.findPreviousPeriod(eq(revenueContractId), any())).thenReturn(Optional.empty());
            when(periodRepository.save(any(RevenueRecognitionPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

            CalculatePeriodRequest request = new CalculatePeriodRequest(
                    new BigDecimal("2100000.00"), UUID.randomUUID());

            RevenueRecognitionPeriodResponse response = periodService.calculatePeriod(periodId, request);

            // Expected loss = 7,000,000 - 5,000,000 = 2,000,000
            assertThat(response.expectedLoss()).isEqualByComparingTo(new BigDecimal("2000000.00"));
            assertThat(response.expectedProfit()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Should cap percent complete at 100% when costs exceed estimate")
        void calculatePeriod_CapAt100Percent() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(revenueContractService.getContractOrThrow(revenueContractId)).thenReturn(testContract);
            when(periodRepository.findPreviousPeriod(eq(revenueContractId), any())).thenReturn(Optional.empty());
            when(periodRepository.save(any(RevenueRecognitionPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

            // Costs exceed estimate: 9,000,000 > 8,000,000
            CalculatePeriodRequest request = new CalculatePeriodRequest(
                    new BigDecimal("9000000.00"), UUID.randomUUID());

            RevenueRecognitionPeriodResponse response = periodService.calculatePeriod(periodId, request);

            assertThat(response.percentComplete()).isEqualByComparingTo(new BigDecimal("100.0000"));
            assertThat(response.estimateCostToComplete()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Should reject calculation for POSTED period")
        void calculatePeriod_RejectPostedStatus() {
            testPeriod.setStatus(PeriodStatus.POSTED);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));

            CalculatePeriodRequest request = new CalculatePeriodRequest(
                    new BigDecimal("2000000.00"), UUID.randomUUID());

            assertThatThrownBy(() -> periodService.calculatePeriod(periodId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Расчёт возможен только для периодов в статусе Открыт или Рассчитан");
        }
    }

    @Nested
    @DisplayName("Period Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should transition from CALCULATED to REVIEWED")
        void changeStatus_CalculatedToReviewed() {
            testPeriod.setStatus(PeriodStatus.CALCULATED);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(periodRepository.save(any(RevenueRecognitionPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

            UUID reviewerId = UUID.randomUUID();
            ChangePeriodStatusRequest request = new ChangePeriodStatusRequest(
                    PeriodStatus.REVIEWED, reviewerId);

            RevenueRecognitionPeriodResponse response = periodService.changeStatus(periodId, request);

            assertThat(response.status()).isEqualTo(PeriodStatus.REVIEWED);
            assertThat(response.reviewedById()).isEqualTo(reviewerId);
            verify(auditService).logStatusChange("RevenueRecognitionPeriod", periodId,
                    "CALCULATED", "REVIEWED");
        }

        @Test
        @DisplayName("Should transition from REVIEWED to POSTED with timestamp")
        void changeStatus_ReviewedToPosted() {
            testPeriod.setStatus(PeriodStatus.REVIEWED);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(periodRepository.save(any(RevenueRecognitionPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

            UUID posterId = UUID.randomUUID();
            ChangePeriodStatusRequest request = new ChangePeriodStatusRequest(
                    PeriodStatus.POSTED, posterId);

            RevenueRecognitionPeriodResponse response = periodService.changeStatus(periodId, request);

            assertThat(response.status()).isEqualTo(PeriodStatus.POSTED);
            assertThat(response.postedById()).isEqualTo(posterId);
            assertThat(response.postedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should reject invalid transition from OPEN to POSTED")
        void changeStatus_InvalidTransition() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));

            ChangePeriodStatusRequest request = new ChangePeriodStatusRequest(
                    PeriodStatus.POSTED, UUID.randomUUID());

            assertThatThrownBy(() -> periodService.changeStatus(periodId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести период из статуса");
        }

        @Test
        @DisplayName("Should reject invalid transition from CLOSED")
        void changeStatus_ClosedRejectsAll() {
            testPeriod.setStatus(PeriodStatus.CLOSED);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));

            ChangePeriodStatusRequest request = new ChangePeriodStatusRequest(
                    PeriodStatus.OPEN, UUID.randomUUID());

            assertThatThrownBy(() -> periodService.changeStatus(periodId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести период");
        }
    }

    @Nested
    @DisplayName("Create / Delete Period")
    class CreateDeleteTests {

        @Test
        @DisplayName("Should create period with OPEN status")
        void createPeriod_Success() {
            when(revenueContractService.getContractOrThrow(revenueContractId)).thenReturn(testContract);
            when(periodRepository.findByRevenueContractIdAndPeriodStartAndPeriodEndAndDeletedFalse(
                    any(), any(), any())).thenReturn(Optional.empty());
            when(periodRepository.save(any(RevenueRecognitionPeriod.class))).thenAnswer(inv -> {
                RevenueRecognitionPeriod p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            CreateRecognitionPeriodRequest request = new CreateRecognitionPeriodRequest(
                    revenueContractId,
                    LocalDate.of(2025, 4, 1),
                    LocalDate.of(2025, 6, 30),
                    null, "Q2 2025");

            RevenueRecognitionPeriodResponse response = periodService.createPeriod(request);

            assertThat(response.status()).isEqualTo(PeriodStatus.OPEN);
            assertThat(response.periodStart()).isEqualTo(LocalDate.of(2025, 4, 1));
            verify(auditService).logCreate(eq("RevenueRecognitionPeriod"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject deleting POSTED period")
        void deletePeriod_RejectPosted() {
            testPeriod.setStatus(PeriodStatus.POSTED);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));

            assertThatThrownBy(() -> periodService.deletePeriod(periodId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно удалить период в статусе Проведён или Закрыт");
        }
    }
}
