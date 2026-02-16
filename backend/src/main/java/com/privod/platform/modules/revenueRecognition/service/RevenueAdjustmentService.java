package com.privod.platform.modules.revenueRecognition.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.revenueRecognition.domain.PeriodStatus;
import com.privod.platform.modules.revenueRecognition.domain.RevenueAdjustment;
import com.privod.platform.modules.revenueRecognition.domain.RevenueRecognitionPeriod;
import com.privod.platform.modules.revenueRecognition.repository.RevenueAdjustmentRepository;
import com.privod.platform.modules.revenueRecognition.web.dto.CreateRevenueAdjustmentRequest;
import com.privod.platform.modules.revenueRecognition.web.dto.RevenueAdjustmentResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RevenueAdjustmentService {

    private static final List<String> VALID_TYPES = List.of(
            "COST_REVISION", "REVENUE_REVISION", "LOSS_PROVISION");

    private final RevenueAdjustmentRepository adjustmentRepository;
    private final RevenueRecognitionPeriodService periodService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<RevenueAdjustmentResponse> listByPeriod(UUID periodId, Pageable pageable) {
        return adjustmentRepository
                .findByRecognitionPeriodIdAndDeletedFalseOrderByCreatedAtDesc(periodId, pageable)
                .map(RevenueAdjustmentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public RevenueAdjustmentResponse getById(UUID id) {
        RevenueAdjustment adj = getOrThrow(id);
        return RevenueAdjustmentResponse.fromEntity(adj);
    }

    @Transactional
    public RevenueAdjustmentResponse create(CreateRevenueAdjustmentRequest request) {
        if (!VALID_TYPES.contains(request.adjustmentType())) {
            throw new IllegalArgumentException(
                    "Недопустимый тип корректировки: " + request.adjustmentType()
                            + ". Допустимые: COST_REVISION, REVENUE_REVISION, LOSS_PROVISION");
        }

        RevenueRecognitionPeriod period = periodService.getPeriodOrThrow(request.recognitionPeriodId());

        if (period.getStatus() == PeriodStatus.POSTED || period.getStatus() == PeriodStatus.CLOSED) {
            throw new IllegalStateException(
                    "Невозможно создать корректировку для периода в статусе Проведён или Закрыт");
        }

        RevenueAdjustment adjustment = RevenueAdjustment.builder()
                .recognitionPeriodId(request.recognitionPeriodId())
                .adjustmentType(request.adjustmentType())
                .amount(request.amount())
                .reason(request.reason())
                .previousValue(request.previousValue())
                .newValue(request.newValue())
                .approvedById(request.approvedById())
                .approvedAt(request.approvedById() != null ? Instant.now() : null)
                .build();

        adjustment = adjustmentRepository.save(adjustment);

        // Update adjustment total on the period
        BigDecimal totalAdjustments = adjustmentRepository.sumAdjustmentsByPeriod(period.getId());
        period.setAdjustmentAmount(totalAdjustments);

        auditService.logCreate("RevenueAdjustment", adjustment.getId());

        log.info("RevenueAdjustment created: {} type={} amount={} for period {}",
                adjustment.getId(), adjustment.getAdjustmentType(),
                adjustment.getAmount(), adjustment.getRecognitionPeriodId());
        return RevenueAdjustmentResponse.fromEntity(adjustment);
    }

    @Transactional
    public RevenueAdjustmentResponse approve(UUID id, UUID approvedById) {
        RevenueAdjustment adjustment = getOrThrow(id);

        if (adjustment.getApprovedAt() != null) {
            throw new IllegalStateException("Корректировка уже утверждена");
        }

        adjustment.setApprovedById(approvedById);
        adjustment.setApprovedAt(Instant.now());
        adjustment = adjustmentRepository.save(adjustment);

        auditService.logUpdate("RevenueAdjustment", id, "approvedById", null,
                approvedById != null ? approvedById.toString() : null);

        log.info("RevenueAdjustment approved: {} by {}", id, approvedById);
        return RevenueAdjustmentResponse.fromEntity(adjustment);
    }

    @Transactional
    public void delete(UUID id) {
        RevenueAdjustment adjustment = getOrThrow(id);

        if (adjustment.getApprovedAt() != null) {
            throw new IllegalStateException(
                    "Невозможно удалить утверждённую корректировку");
        }

        adjustment.softDelete();
        adjustmentRepository.save(adjustment);
        auditService.logDelete("RevenueAdjustment", id);
        log.info("RevenueAdjustment soft-deleted: {}", id);
    }

    private RevenueAdjustment getOrThrow(UUID id) {
        return adjustmentRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Корректировка выручки не найдена: " + id));
    }
}
