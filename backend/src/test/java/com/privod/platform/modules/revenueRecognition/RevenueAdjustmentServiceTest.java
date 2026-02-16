package com.privod.platform.modules.revenueRecognition;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.revenueRecognition.domain.PeriodStatus;
import com.privod.platform.modules.revenueRecognition.domain.RevenueAdjustment;
import com.privod.platform.modules.revenueRecognition.domain.RevenueRecognitionPeriod;
import com.privod.platform.modules.revenueRecognition.repository.RevenueAdjustmentRepository;
import com.privod.platform.modules.revenueRecognition.service.RevenueAdjustmentService;
import com.privod.platform.modules.revenueRecognition.service.RevenueRecognitionPeriodService;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRevenueAdjustmentRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueAdjustmentResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
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
    private RevenueAdjustmentService adjustmentService;

    private UUID periodId;
    private UUID adjustmentId;
    private RevenueRecognitionPeriod testPeriod;

    @BeforeEach
    void setUp() {
        periodId = UUID.randomUUID();
        adjustmentId = UUID.randomUUID();

        testPeriod = RevenueRecognitionPeriod.builder()
                .revenueContractId(UUID.randomUUID())
                .periodStart(java.time.LocalDate.of(2025, 1, 1))
                .periodEnd(java.time.LocalDate.of(2025, 3, 31))
                .status(PeriodStatus.CALCULATED)
                .adjustmentAmount(BigDecimal.ZERO)
                .build();
        testPeriod.setId(periodId);
        testPeriod.setCreatedAt(Instant.now());
    }

    @Test
    @DisplayName("Should create COST_REVISION adjustment for calculated period")
    void create_CostRevisionAdjustment() {
        when(periodService.getPeriodOrThrow(periodId)).thenReturn(testPeriod);
        when(adjustmentRepository.save(any(RevenueAdjustment.class))).thenAnswer(inv -> {
            RevenueAdjustment a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            a.setCreatedAt(Instant.now());
            return a;
        });
        when(adjustmentRepository.sumAdjustmentsByPeriod(periodId))
                .thenReturn(new BigDecimal("500000.00"));

        CreateRevenueAdjustmentRequest request = new CreateRevenueAdjustmentRequest(
                periodId, "COST_REVISION", new BigDecimal("500000.00"),
                "Пересмотр сметной стоимости материалов",
                new BigDecimal("8000000.00"), new BigDecimal("8500000.00"),
                null);

        RevenueAdjustmentResponse response = adjustmentService.create(request);

        assertThat(response.adjustmentType()).isEqualTo("COST_REVISION");
        assertThat(response.amount()).isEqualByComparingTo(new BigDecimal("500000.00"));
        assertThat(response.reason()).isEqualTo("Пересмотр сметной стоимости материалов");
        verify(auditService).logCreate(eq("RevenueAdjustment"), any(UUID.class));
    }

    @Test
    @DisplayName("Should reject adjustment for POSTED period")
    void create_RejectPostedPeriod() {
        testPeriod.setStatus(PeriodStatus.POSTED);
        when(periodService.getPeriodOrThrow(periodId)).thenReturn(testPeriod);

        CreateRevenueAdjustmentRequest request = new CreateRevenueAdjustmentRequest(
                periodId, "COST_REVISION", new BigDecimal("100000.00"),
                "Попытка корректировки", null, null, null);

        assertThatThrownBy(() -> adjustmentService.create(request))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Невозможно создать корректировку для периода в статусе Проведён или Закрыт");
    }

    @Test
    @DisplayName("Should reject invalid adjustment type")
    void create_InvalidAdjustmentType() {
        CreateRevenueAdjustmentRequest request = new CreateRevenueAdjustmentRequest(
                periodId, "INVALID_TYPE", new BigDecimal("100000.00"),
                "Причина", null, null, null);

        assertThatThrownBy(() -> adjustmentService.create(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Недопустимый тип корректировки");
    }

    @Test
    @DisplayName("Should approve unapproved adjustment")
    void approve_Success() {
        RevenueAdjustment adjustment = RevenueAdjustment.builder()
                .recognitionPeriodId(periodId)
                .adjustmentType("LOSS_PROVISION")
                .amount(new BigDecimal("2000000.00"))
                .reason("Формирование резерва под убыток")
                .build();
        adjustment.setId(adjustmentId);
        adjustment.setCreatedAt(Instant.now());

        when(adjustmentRepository.findById(adjustmentId)).thenReturn(Optional.of(adjustment));
        when(adjustmentRepository.save(any(RevenueAdjustment.class))).thenAnswer(inv -> inv.getArgument(0));

        UUID approverId = UUID.randomUUID();
        RevenueAdjustmentResponse response = adjustmentService.approve(adjustmentId, approverId);

        assertThat(response.approvedById()).isEqualTo(approverId);
        assertThat(response.approvedAt()).isNotNull();
        verify(auditService).logUpdate("RevenueAdjustment", adjustmentId, "approvedById",
                null, approverId.toString());
    }

    @Test
    @DisplayName("Should reject approving already approved adjustment")
    void approve_AlreadyApproved() {
        RevenueAdjustment adjustment = RevenueAdjustment.builder()
                .recognitionPeriodId(periodId)
                .adjustmentType("REVENUE_REVISION")
                .amount(new BigDecimal("100000.00"))
                .reason("Причина")
                .approvedById(UUID.randomUUID())
                .approvedAt(Instant.now())
                .build();
        adjustment.setId(adjustmentId);
        adjustment.setCreatedAt(Instant.now());

        when(adjustmentRepository.findById(adjustmentId)).thenReturn(Optional.of(adjustment));

        assertThatThrownBy(() -> adjustmentService.approve(adjustmentId, UUID.randomUUID()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Корректировка уже утверждена");
    }

    @Test
    @DisplayName("Should reject deleting approved adjustment")
    void delete_RejectApproved() {
        RevenueAdjustment adjustment = RevenueAdjustment.builder()
                .recognitionPeriodId(periodId)
                .adjustmentType("COST_REVISION")
                .amount(new BigDecimal("100000.00"))
                .reason("Причина")
                .approvedById(UUID.randomUUID())
                .approvedAt(Instant.now())
                .build();
        adjustment.setId(adjustmentId);
        adjustment.setCreatedAt(Instant.now());

        when(adjustmentRepository.findById(adjustmentId)).thenReturn(Optional.of(adjustment));

        assertThatThrownBy(() -> adjustmentService.delete(adjustmentId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("Невозможно удалить утверждённую корректировку");
    }
}
