package com.privod.platform.modules.revenueRecognition.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.revenueRecognition.domain.PeriodStatus;
import com.privod.platform.modules.revenueRecognition.domain.RevenueAdjustment;
import com.privod.platform.modules.revenueRecognition.domain.RevenueRecognitionPeriod;
import com.privod.platform.modules.revenueRecognition.repository.RevenueAdjustmentRepository;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRevenueAdjustmentRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueAdjustmentResponse;
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
class RevenueAdjustmentServiceTest {

    @Mock
    private RevenueAdjustmentRepository adjustmentRepository;

    @Mock
    private RevenueRecognitionPeriodService periodService;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RevenueAdjustmentService revenueAdjustmentService;

    private UUID periodId;
    private UUID adjustmentId;
    private RevenueRecognitionPeriod testPeriod;
    private RevenueAdjustment testAdjustment;

    @BeforeEach
    void setUp() {
        periodId = UUID.randomUUID();
        adjustmentId = UUID.randomUUID();

        testPeriod = RevenueRecognitionPeriod.builder()
                .revenueContractId(UUID.randomUUID())
                .periodStart(LocalDate.of(2025, 1, 1))
                .periodEnd(LocalDate.of(2025, 3, 31))
                .status(PeriodStatus.CALCULATED)
                .adjustmentAmount(BigDecimal.ZERO)
                .build();
        testPeriod.setId(periodId);
        testPeriod.setCreatedAt(Instant.now());

        testAdjustment = RevenueAdjustment.builder()
                .recognitionPeriodId(periodId)
                .adjustmentType("COST_REVISION")
                .amount(new BigDecimal("100000"))
                .reason("Updated cost estimate")
                .previousValue(new BigDecimal("8000000"))
                .newValue(new BigDecimal("8100000"))
                .build();
        testAdjustment.setId(adjustmentId);
        testAdjustment.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Revenue Adjustment")
    class CreateTests {

        @Test
        @DisplayName("Should create adjustment when period is not POSTED or CLOSED")
        void shouldCreateAdjustment_whenValidInput() {
            when(periodService.getPeriodOrThrow(periodId)).thenReturn(testPeriod);
            when(adjustmentRepository.save(any(RevenueAdjustment.class))).thenAnswer(inv -> {
                RevenueAdjustment a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });
            when(adjustmentRepository.sumAdjustmentsByPeriod(periodId))
                    .thenReturn(new BigDecimal("100000"));

            CreateRevenueAdjustmentRequest request = new CreateRevenueAdjustmentRequest(
                    periodId, "COST_REVISION", new BigDecimal("100000"),
                    "Updated cost estimate", new BigDecimal("8000000"),
                    new BigDecimal("8100000"), null);

            RevenueAdjustmentResponse response = revenueAdjustmentService.create(request);

            assertThat(response).isNotNull();
            assertThat(response.adjustmentType()).isEqualTo("COST_REVISION");
            assertThat(response.amount()).isEqualByComparingTo("100000");
            verify(auditService).logCreate(eq("RevenueAdjustment"), any(UUID.class));
        }

        @Test
        @DisplayName("Should set approvedAt when approvedById is provided")
        void shouldSetApprovedAt_whenApprovedByIdProvided() {
            when(periodService.getPeriodOrThrow(periodId)).thenReturn(testPeriod);
            when(adjustmentRepository.save(any(RevenueAdjustment.class))).thenAnswer(inv -> {
                RevenueAdjustment a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });
            when(adjustmentRepository.sumAdjustmentsByPeriod(periodId)).thenReturn(new BigDecimal("50000"));

            UUID approverId = UUID.randomUUID();
            CreateRevenueAdjustmentRequest request = new CreateRevenueAdjustmentRequest(
                    periodId, "REVENUE_REVISION", new BigDecimal("50000"),
                    "Revenue adjustment", null, null, approverId);

            RevenueAdjustmentResponse response = revenueAdjustmentService.create(request);

            assertThat(response.approvedById()).isEqualTo(approverId);
            assertThat(response.approvedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should update period adjustment total after creating adjustment")
        void shouldUpdatePeriodAdjustmentTotal() {
            when(periodService.getPeriodOrThrow(periodId)).thenReturn(testPeriod);
            when(adjustmentRepository.save(any(RevenueAdjustment.class))).thenAnswer(inv -> {
                RevenueAdjustment a = inv.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });
            when(adjustmentRepository.sumAdjustmentsByPeriod(periodId))
                    .thenReturn(new BigDecimal("150000"));

            CreateRevenueAdjustmentRequest request = new CreateRevenueAdjustmentRequest(
                    periodId, "COST_REVISION", new BigDecimal("50000"),
                    "Additional cost revision", null, null, null);

            revenueAdjustmentService.create(request);

            assertThat(testPeriod.getAdjustmentAmount()).isEqualByComparingTo("150000");
        }

        @Test
        @DisplayName("Should reject invalid adjustment type")
        void shouldThrowException_whenInvalidType() {
            CreateRevenueAdjustmentRequest request = new CreateRevenueAdjustmentRequest(
                    periodId, "INVALID_TYPE", new BigDecimal("1000"),
                    "Some reason", null, null, null);

            assertThatThrownBy(() -> revenueAdjustmentService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Недопустимый тип корректировки");
        }

        @Test
        @DisplayName("Should reject adjustment when period is POSTED")
        void shouldThrowException_whenPeriodPosted() {
            testPeriod.setStatus(PeriodStatus.POSTED);
            when(periodService.getPeriodOrThrow(periodId)).thenReturn(testPeriod);

            CreateRevenueAdjustmentRequest request = new CreateRevenueAdjustmentRequest(
                    periodId, "COST_REVISION", new BigDecimal("1000"),
                    "Reason", null, null, null);

            assertThatThrownBy(() -> revenueAdjustmentService.create(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Проведён или Закрыт");
        }

        @Test
        @DisplayName("Should reject adjustment when period is CLOSED")
        void shouldThrowException_whenPeriodClosed() {
            testPeriod.setStatus(PeriodStatus.CLOSED);
            when(periodService.getPeriodOrThrow(periodId)).thenReturn(testPeriod);

            CreateRevenueAdjustmentRequest request = new CreateRevenueAdjustmentRequest(
                    periodId, "LOSS_PROVISION", new BigDecimal("500000"),
                    "Loss provision", null, null, null);

            assertThatThrownBy(() -> revenueAdjustmentService.create(request))
                    .isInstanceOf(IllegalStateException.class);
        }
    }

    @Nested
    @DisplayName("Approve Revenue Adjustment")
    class ApproveTests {

        @Test
        @DisplayName("Should approve adjustment")
        void shouldApproveAdjustment() {
            when(adjustmentRepository.findById(adjustmentId)).thenReturn(Optional.of(testAdjustment));
            when(adjustmentRepository.save(any(RevenueAdjustment.class))).thenAnswer(inv -> inv.getArgument(0));

            UUID approverId = UUID.randomUUID();
            RevenueAdjustmentResponse response = revenueAdjustmentService.approve(adjustmentId, approverId);

            assertThat(response.approvedById()).isEqualTo(approverId);
            assertThat(response.approvedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should reject approval of already-approved adjustment")
        void shouldThrowException_whenAlreadyApproved() {
            testAdjustment.setApprovedAt(Instant.now());
            testAdjustment.setApprovedById(UUID.randomUUID());
            when(adjustmentRepository.findById(adjustmentId)).thenReturn(Optional.of(testAdjustment));

            assertThatThrownBy(() -> revenueAdjustmentService.approve(adjustmentId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("уже утверждена");
        }
    }

    @Nested
    @DisplayName("Read Revenue Adjustment")
    class ReadTests {

        @Test
        @DisplayName("Should get adjustment by ID")
        void shouldReturnAdjustment_whenFound() {
            when(adjustmentRepository.findById(adjustmentId)).thenReturn(Optional.of(testAdjustment));

            RevenueAdjustmentResponse response = revenueAdjustmentService.getById(adjustmentId);

            assertThat(response).isNotNull();
            assertThat(response.adjustmentType()).isEqualTo("COST_REVISION");
        }

        @Test
        @DisplayName("Should throw when adjustment not found")
        void shouldThrowException_whenNotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(adjustmentRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> revenueAdjustmentService.getById(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class);
        }

        @Test
        @DisplayName("Should return paginated adjustments for period")
        void shouldReturnPagedAdjustments_forPeriod() {
            Pageable pageable = PageRequest.of(0, 20);
            Page<RevenueAdjustment> page = new PageImpl<>(List.of(testAdjustment));
            when(adjustmentRepository
                    .findByRecognitionPeriodIdAndDeletedFalseOrderByCreatedAtDesc(periodId, pageable))
                    .thenReturn(page);

            Page<RevenueAdjustmentResponse> result =
                    revenueAdjustmentService.listByPeriod(periodId, pageable);

            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("Delete Revenue Adjustment")
    class DeleteTests {

        @Test
        @DisplayName("Should soft delete unapproved adjustment")
        void shouldSoftDelete_whenNotApproved() {
            when(adjustmentRepository.findById(adjustmentId)).thenReturn(Optional.of(testAdjustment));
            when(adjustmentRepository.save(any(RevenueAdjustment.class))).thenReturn(testAdjustment);

            revenueAdjustmentService.delete(adjustmentId);

            assertThat(testAdjustment.isDeleted()).isTrue();
            verify(auditService).logDelete("RevenueAdjustment", adjustmentId);
        }

        @Test
        @DisplayName("Should reject deleting approved adjustment")
        void shouldThrowException_whenDeletingApproved() {
            testAdjustment.setApprovedAt(Instant.now());
            when(adjustmentRepository.findById(adjustmentId)).thenReturn(Optional.of(testAdjustment));

            assertThatThrownBy(() -> revenueAdjustmentService.delete(adjustmentId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("утверждённую");
        }
    }
}
