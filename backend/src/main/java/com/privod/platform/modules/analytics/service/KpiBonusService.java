package com.privod.platform.modules.analytics.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.analytics.domain.BonusCalculation;
import com.privod.platform.modules.analytics.domain.BonusStatus;
import com.privod.platform.modules.analytics.domain.KpiAchievement;
import com.privod.platform.modules.analytics.repository.BonusCalculationRepository;
import com.privod.platform.modules.analytics.repository.KpiAchievementRepository;
import com.privod.platform.modules.analytics.web.dto.BonusCalculationResponse;
import com.privod.platform.modules.analytics.web.dto.CreateBonusCalculationRequest;
import com.privod.platform.modules.analytics.web.dto.CreateKpiAchievementRequest;
import com.privod.platform.modules.analytics.web.dto.KpiAchievementResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class KpiBonusService {

    private final KpiAchievementRepository achievementRepository;
    private final BonusCalculationRepository bonusRepository;
    private final AuditService auditService;

    // ========================================================================
    // KPI Achievements
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<KpiAchievementResponse> listAchievements(UUID employeeId, String period, Pageable pageable) {
        if (employeeId != null) {
            return achievementRepository.findByEmployeeIdAndDeletedFalse(employeeId, pageable)
                    .map(KpiAchievementResponse::fromEntity);
        }
        if (period != null) {
            return achievementRepository.findByPeriodAndDeletedFalse(period, pageable)
                    .map(KpiAchievementResponse::fromEntity);
        }
        return achievementRepository.findByDeletedFalse(pageable)
                .map(KpiAchievementResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public KpiAchievementResponse getAchievement(UUID id) {
        KpiAchievement achievement = getAchievementOrThrow(id);
        return KpiAchievementResponse.fromEntity(achievement);
    }

    @Transactional(readOnly = true)
    public List<KpiAchievementResponse> getAchievementsForEmployee(UUID employeeId, String period) {
        return achievementRepository.findByEmployeeIdAndPeriodAndDeletedFalse(employeeId, period)
                .stream()
                .map(KpiAchievementResponse::fromEntity)
                .toList();
    }

    @Transactional
    public KpiAchievementResponse createAchievement(CreateKpiAchievementRequest request) {
        BigDecimal achievementPercent = request.achievementPercent();
        if (achievementPercent == null && request.targetValue() != null && request.actualValue() != null
                && request.targetValue().compareTo(BigDecimal.ZERO) != 0) {
            achievementPercent = request.actualValue()
                    .divide(request.targetValue(), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        KpiAchievement achievement = KpiAchievement.builder()
                .employeeId(request.employeeId())
                .kpiId(request.kpiId())
                .period(request.period())
                .targetValue(request.targetValue())
                .actualValue(request.actualValue())
                .achievementPercent(achievementPercent)
                .score(request.score())
                .notes(request.notes())
                .build();

        achievement = achievementRepository.save(achievement);
        auditService.logCreate("KpiAchievement", achievement.getId());

        log.info("KPI достижение записано: сотрудник={}, kpi={}, период={} ({})",
                request.employeeId(), request.kpiId(), request.period(), achievement.getId());
        return KpiAchievementResponse.fromEntity(achievement);
    }

    @Transactional
    public void deleteAchievement(UUID id) {
        KpiAchievement achievement = getAchievementOrThrow(id);
        achievement.softDelete();
        achievementRepository.save(achievement);
        auditService.logDelete("KpiAchievement", id);
        log.info("KPI достижение удалено: {}", id);
    }

    // ========================================================================
    // Bonus Calculations
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<BonusCalculationResponse> listBonuses(UUID employeeId, BonusStatus status, Pageable pageable) {
        if (employeeId != null) {
            return bonusRepository.findByEmployeeIdAndDeletedFalse(employeeId, pageable)
                    .map(BonusCalculationResponse::fromEntity);
        }
        if (status != null) {
            return bonusRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(BonusCalculationResponse::fromEntity);
        }
        return bonusRepository.findByDeletedFalse(pageable)
                .map(BonusCalculationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public BonusCalculationResponse getBonus(UUID id) {
        BonusCalculation bonus = getBonusOrThrow(id);
        return BonusCalculationResponse.fromEntity(bonus);
    }

    @Transactional
    public BonusCalculationResponse createBonus(CreateBonusCalculationRequest request) {
        BigDecimal finalBonus = request.finalBonus();
        if (finalBonus == null && request.baseBonus() != null && request.kpiMultiplier() != null) {
            finalBonus = request.baseBonus().multiply(request.kpiMultiplier()).setScale(2, RoundingMode.HALF_UP);
        }

        BonusCalculation bonus = BonusCalculation.builder()
                .employeeId(request.employeeId())
                .employeeName(request.employeeName())
                .period(request.period())
                .baseBonus(request.baseBonus())
                .kpiMultiplier(request.kpiMultiplier())
                .finalBonus(finalBonus)
                .status(BonusStatus.DRAFT)
                .build();

        bonus = bonusRepository.save(bonus);
        auditService.logCreate("BonusCalculation", bonus.getId());

        log.info("Расчёт бонуса создан: сотрудник={}, период={} ({})",
                request.employeeId(), request.period(), bonus.getId());
        return BonusCalculationResponse.fromEntity(bonus);
    }

    @Transactional
    public BonusCalculationResponse calculateBonus(UUID id) {
        BonusCalculation bonus = getBonusOrThrow(id);

        if (bonus.getStatus() != BonusStatus.DRAFT) {
            throw new IllegalStateException("Расчёт возможен только в статусе Черновик");
        }

        if (bonus.getBaseBonus() != null && bonus.getKpiMultiplier() != null) {
            BigDecimal finalBonus = bonus.getBaseBonus()
                    .multiply(bonus.getKpiMultiplier())
                    .setScale(2, RoundingMode.HALF_UP);
            bonus.setFinalBonus(finalBonus);
        }

        BonusStatus oldStatus = bonus.getStatus();
        bonus.setStatus(BonusStatus.CALCULATED);
        bonus = bonusRepository.save(bonus);
        auditService.logStatusChange("BonusCalculation", bonus.getId(), oldStatus.name(), BonusStatus.CALCULATED.name());

        log.info("Бонус рассчитан: {} = {}", bonus.getId(), bonus.getFinalBonus());
        return BonusCalculationResponse.fromEntity(bonus);
    }

    @Transactional
    public BonusCalculationResponse approveBonus(UUID id, UUID approvedById) {
        BonusCalculation bonus = getBonusOrThrow(id);

        if (bonus.getStatus() != BonusStatus.CALCULATED) {
            throw new IllegalStateException("Утвердить можно только рассчитанный бонус");
        }

        BonusStatus oldStatus = bonus.getStatus();
        bonus.setStatus(BonusStatus.APPROVED);
        bonus.setApprovedById(approvedById);
        bonus.setApprovedAt(LocalDateTime.now());
        bonus = bonusRepository.save(bonus);
        auditService.logStatusChange("BonusCalculation", bonus.getId(), oldStatus.name(), BonusStatus.APPROVED.name());

        log.info("Бонус утверждён: {} утвердил {}", bonus.getId(), approvedById);
        return BonusCalculationResponse.fromEntity(bonus);
    }

    @Transactional
    public BonusCalculationResponse markAsPaid(UUID id) {
        BonusCalculation bonus = getBonusOrThrow(id);

        if (bonus.getStatus() != BonusStatus.APPROVED) {
            throw new IllegalStateException("Отметить как выплаченный можно только утверждённый бонус");
        }

        BonusStatus oldStatus = bonus.getStatus();
        bonus.setStatus(BonusStatus.PAID);
        bonus.setPaidAt(LocalDateTime.now());
        bonus = bonusRepository.save(bonus);
        auditService.logStatusChange("BonusCalculation", bonus.getId(), oldStatus.name(), BonusStatus.PAID.name());

        log.info("Бонус выплачен: {}", bonus.getId());
        return BonusCalculationResponse.fromEntity(bonus);
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private KpiAchievement getAchievementOrThrow(UUID id) {
        return achievementRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("KPI достижение не найдено: " + id));
    }

    private BonusCalculation getBonusOrThrow(UUID id) {
        return bonusRepository.findById(id)
                .filter(b -> !b.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Расчёт бонуса не найден: " + id));
    }
}
