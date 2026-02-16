package com.privod.platform.modules.revenueRecognition.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.revenueRecognition.domain.PeriodStatus;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import com.privod.platform.modules.revenueRecognition.domain.RevenueContract;
import com.privod.platform.modules.revenueRecognition.domain.RevenueRecognitionPeriod;
import com.privod.platform.modules.revenueRecognition.repository.RevenueRecognitionPeriodRepository;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
class RevenueRecognitionPeriodServiceTest {

    @Mock
    private RevenueRecognitionPeriodRepository periodRepository;

    @Mock
    private RevenueContractService revenueContractService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RevenueRecognitionPeriodService periodService;

    private UUID contractId;
    private UUID periodId;
    private RevenueContract testContract;
    private RevenueRecognitionPeriod testPeriod;

    @BeforeEach
    void setUp() {
        contractId = UUID.randomUUID();
        periodId = UUID.randomUUID();

        testContract = RevenueContract.builder()
                .projectId(UUID.randomUUID())
                .contractName("Construction Contract")
                .recognitionMethod(RecognitionMethod.PERCENTAGE_OF_COMPLETION)
                .recognitionStandard(RecognitionStandard.PBU_2_2008)
                .totalContractRevenue(new BigDecimal("10000000"))
                .totalEstimatedCost(new BigDecimal("8000000"))
                .organizationId(UUID.randomUUID())
                .build();
        testContract.setId(contractId);

        testPeriod = RevenueRecognitionPeriod.builder()
                .revenueContractId(contractId)
                .periodStart(LocalDate.of(2025, 1, 1))
                .periodEnd(LocalDate.of(2025, 3, 31))
                .status(PeriodStatus.OPEN)
                .cumulativeCostIncurred(new BigDecimal("2000000"))
                .build();
        testPeriod.setId(periodId);
        testPeriod.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Recognition Period")
    class CreateTests {

        @Test
        @DisplayName("Should create period with OPEN status")
        void shouldCreatePeriod_whenValidInput() {
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);
            when(periodRepository.findByRevenueContractIdAndPeriodStartAndPeriodEndAndDeletedFalse(
                    any(), any(), any())).thenReturn(Optional.empty());

            CreateRecognitionPeriodRequest request = new CreateRecognitionPeriodRequest(
                    contractId,
                    LocalDate.of(2025, 4, 1), LocalDate.of(2025, 6, 30),
                    new BigDecimal("3500000"), "Q2 period");

            when(periodRepository.save(any(RevenueRecognitionPeriod.class))).thenAnswer(inv -> {
                RevenueRecognitionPeriod p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            RevenueRecognitionPeriodResponse response = periodService.createPeriod(request);

            assertThat(response).isNotNull();
            assertThat(response.status()).isEqualTo(PeriodStatus.OPEN);
            verify(auditService).logCreate(eq("RevenueRecognitionPeriod"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject when period end is before start")
        void shouldThrowException_whenEndBeforeStart() {
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);

            CreateRecognitionPeriodRequest request = new CreateRecognitionPeriodRequest(
                    contractId,
                    LocalDate.of(2025, 6, 30), LocalDate.of(2025, 1, 1),
                    null, null);

            assertThatThrownBy(() -> periodService.createPeriod(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("позже");
        }

        @Test
        @DisplayName("Should reject when overlapping period exists")
        void shouldThrowException_whenOverlappingPeriod() {
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);
            when(periodRepository.findByRevenueContractIdAndPeriodStartAndPeriodEndAndDeletedFalse(
                    contractId, LocalDate.of(2025, 1, 1), LocalDate.of(2025, 3, 31)))
                    .thenReturn(Optional.of(testPeriod));

            CreateRecognitionPeriodRequest request = new CreateRecognitionPeriodRequest(
                    contractId,
                    LocalDate.of(2025, 1, 1), LocalDate.of(2025, 3, 31),
                    null, null);

            assertThatThrownBy(() -> periodService.createPeriod(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("Calculate Period Revenue")
    class CalculationTests {

        @Test
        @DisplayName("Should calculate revenue using percentage of completion method")
        void shouldCalculateRevenue_percentageOfCompletion() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);
            when(periodRepository.findPreviousPeriod(contractId, testPeriod.getPeriodStart()))
                    .thenReturn(Optional.empty());
            when(periodRepository.save(any(RevenueRecognitionPeriod.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            CalculatePeriodRequest request = new CalculatePeriodRequest(
                    new BigDecimal("2000000"), UUID.randomUUID());

            RevenueRecognitionPeriodResponse response = periodService.calculatePeriod(periodId, request);

            assertThat(response).isNotNull();
            assertThat(response.status()).isEqualTo(PeriodStatus.CALCULATED);
            // percentComplete = 2000000 / 8000000 * 100 = 25.0000
            assertThat(response.percentComplete()).isEqualByComparingTo("25.0000");
            // cumulativeRevenue = 10000000 * 2000000 / 8000000 = 2500000
            assertThat(response.cumulativeRevenueRecognized()).isEqualByComparingTo("2500000.00");
            // periodRevenue = 2500000 - 0 = 2500000
            assertThat(response.periodRevenueRecognized()).isEqualByComparingTo("2500000.00");
            verify(auditService).logStatusChange(eq("RevenueRecognitionPeriod"), eq(periodId),
                    eq("OPEN"), eq("CALCULATED"));
        }

        @Test
        @DisplayName("Should calculate period revenue minus previous period cumulative revenue")
        void shouldCalculatePeriodRevenue_minusPreviousCumulative() {
            RevenueRecognitionPeriod prevPeriod = RevenueRecognitionPeriod.builder()
                    .revenueContractId(contractId)
                    .periodStart(LocalDate.of(2024, 10, 1))
                    .periodEnd(LocalDate.of(2024, 12, 31))
                    .cumulativeRevenueRecognized(new BigDecimal("1250000"))
                    .cumulativeCostIncurred(new BigDecimal("1000000"))
                    .build();

            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);
            when(periodRepository.findPreviousPeriod(contractId, testPeriod.getPeriodStart()))
                    .thenReturn(Optional.of(prevPeriod));
            when(periodRepository.save(any(RevenueRecognitionPeriod.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            CalculatePeriodRequest request = new CalculatePeriodRequest(
                    new BigDecimal("2000000"), UUID.randomUUID());

            RevenueRecognitionPeriodResponse response = periodService.calculatePeriod(periodId, request);

            // periodRevenue = 2500000 - 1250000 = 1250000
            assertThat(response.periodRevenueRecognized()).isEqualByComparingTo("1250000.00");
            // periodCost = 2000000 - 1000000 = 1000000
            assertThat(response.periodCostIncurred()).isEqualByComparingTo("1000000");
        }

        @Test
        @DisplayName("Should recognize expected loss for loss contract")
        void shouldRecognizeExpectedLoss_whenLossContract() {
            testContract.setTotalEstimatedCost(new BigDecimal("12000000"));

            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);
            when(periodRepository.findPreviousPeriod(contractId, testPeriod.getPeriodStart()))
                    .thenReturn(Optional.empty());
            when(periodRepository.save(any(RevenueRecognitionPeriod.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            CalculatePeriodRequest request = new CalculatePeriodRequest(
                    new BigDecimal("3000000"), UUID.randomUUID());

            RevenueRecognitionPeriodResponse response = periodService.calculatePeriod(periodId, request);

            // expectedLoss = 12000000 - 10000000 = 2000000
            assertThat(response.expectedLoss()).isEqualByComparingTo("2000000");
            assertThat(response.expectedProfit()).isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("Should cap percent complete at 100%")
        void shouldCapPercentComplete_at100() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(revenueContractService.getContractOrThrow(contractId)).thenReturn(testContract);
            when(periodRepository.findPreviousPeriod(contractId, testPeriod.getPeriodStart()))
                    .thenReturn(Optional.empty());
            when(periodRepository.save(any(RevenueRecognitionPeriod.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            // Cost exceeds estimated cost
            CalculatePeriodRequest request = new CalculatePeriodRequest(
                    new BigDecimal("9000000"), UUID.randomUUID());

            RevenueRecognitionPeriodResponse response = periodService.calculatePeriod(periodId, request);

            assertThat(response.percentComplete()).isEqualByComparingTo("100.0000");
        }

        @Test
        @DisplayName("Should reject calculation when period is POSTED")
        void shouldThrowException_whenPeriodIsPosted() {
            testPeriod.setStatus(PeriodStatus.POSTED);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));

            CalculatePeriodRequest request = new CalculatePeriodRequest(
                    new BigDecimal("2000000"), null);

            assertThatThrownBy(() -> periodService.calculatePeriod(periodId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Открыт или Рассчитан");
        }
    }

    @Nested
    @DisplayName("Change Period Status")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should transition from OPEN to CALCULATED")
        void shouldTransition_openToCalculated() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(periodRepository.save(any(RevenueRecognitionPeriod.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            ChangePeriodStatusRequest request = new ChangePeriodStatusRequest(
                    PeriodStatus.CALCULATED, null);

            RevenueRecognitionPeriodResponse response = periodService.changeStatus(periodId, request);

            assertThat(response.status()).isEqualTo(PeriodStatus.CALCULATED);
        }

        @Test
        @DisplayName("Should reject invalid transition OPEN -> POSTED")
        void shouldThrowException_whenInvalidTransition() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));

            ChangePeriodStatusRequest request = new ChangePeriodStatusRequest(
                    PeriodStatus.POSTED, null);

            assertThatThrownBy(() -> periodService.changeStatus(periodId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно перевести");
        }

        @Test
        @DisplayName("Should set reviewedById when transitioning to REVIEWED")
        void shouldSetReviewerId_whenReviewed() {
            testPeriod.setStatus(PeriodStatus.CALCULATED);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(periodRepository.save(any(RevenueRecognitionPeriod.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            UUID reviewerId = UUID.randomUUID();
            ChangePeriodStatusRequest request = new ChangePeriodStatusRequest(
                    PeriodStatus.REVIEWED, reviewerId);

            periodService.changeStatus(periodId, request);

            ArgumentCaptor<RevenueRecognitionPeriod> captor = ArgumentCaptor.forClass(RevenueRecognitionPeriod.class);
            verify(periodRepository).save(captor.capture());
            assertThat(captor.getValue().getReviewedById()).isEqualTo(reviewerId);
        }

        @Test
        @DisplayName("Should set postedById and postedAt when transitioning to POSTED")
        void shouldSetPostedFields_whenPosted() {
            testPeriod.setStatus(PeriodStatus.REVIEWED);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(periodRepository.save(any(RevenueRecognitionPeriod.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            UUID posterId = UUID.randomUUID();
            ChangePeriodStatusRequest request = new ChangePeriodStatusRequest(
                    PeriodStatus.POSTED, posterId);

            periodService.changeStatus(periodId, request);

            ArgumentCaptor<RevenueRecognitionPeriod> captor = ArgumentCaptor.forClass(RevenueRecognitionPeriod.class);
            verify(periodRepository).save(captor.capture());
            assertThat(captor.getValue().getPostedById()).isEqualTo(posterId);
            assertThat(captor.getValue().getPostedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should reject transition from CLOSED to any state")
        void shouldRejectTransition_fromClosed() {
            testPeriod.setStatus(PeriodStatus.CLOSED);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));

            ChangePeriodStatusRequest request = new ChangePeriodStatusRequest(
                    PeriodStatus.OPEN, null);

            assertThatThrownBy(() -> periodService.changeStatus(periodId, request))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("Delete Recognition Period")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete period when OPEN")
        void shouldSoftDeletePeriod_whenOpen() {
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));
            when(periodRepository.save(any(RevenueRecognitionPeriod.class))).thenReturn(testPeriod);

            periodService.deletePeriod(periodId);

            assertThat(testPeriod.isDeleted()).isTrue();
            verify(auditService).logDelete("RevenueRecognitionPeriod", periodId);
        }

        @Test
        @DisplayName("Should reject delete when period is POSTED")
        void shouldThrowException_whenDeletingPostedPeriod() {
            testPeriod.setStatus(PeriodStatus.POSTED);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));

            assertThatThrownBy(() -> periodService.deletePeriod(periodId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Проведён или Закрыт");
        }

        @Test
        @DisplayName("Should reject delete when period is CLOSED")
        void shouldThrowException_whenDeletingClosedPeriod() {
            testPeriod.setStatus(PeriodStatus.CLOSED);
            when(periodRepository.findById(periodId)).thenReturn(Optional.of(testPeriod));

            assertThatThrownBy(() -> periodService.deletePeriod(periodId))
                    .isInstanceOf(IllegalStateException.class);
        }
    }
}
