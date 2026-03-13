package com.privod.platform.modules.hrRussian.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.hrRussian.domain.RotationSchedule;
import com.privod.platform.modules.hrRussian.domain.RotationStatus;
import com.privod.platform.modules.hrRussian.repository.RotationScheduleRepository;
import com.privod.platform.modules.hrRussian.web.dto.CreateRotationScheduleRequest;
import com.privod.platform.modules.hrRussian.web.dto.RotationScheduleResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * P1-HR-5: Вахтовый метод организации работ (Глава 47 ТК РФ).
 *
 * Вахтовая надбавка (ст. 302 ТК РФ):
 *   - 3% тарифной ставки за каждый день пребывания в пути и на объекте
 *   - Размер устанавливается работодателем (shiftBonusPercent), не ниже нормы
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RotationScheduleService {

    private final RotationScheduleRepository rotationRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<RotationScheduleResponse> list(UUID employeeId, RotationStatus status, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (employeeId != null) {
            return rotationRepository.findByOrganizationIdAndEmployeeIdAndDeletedFalse(organizationId, employeeId, pageable)
                    .map(RotationScheduleResponse::fromEntity);
        }
        if (status != null) {
            return rotationRepository.findByOrganizationIdAndStatusAndDeletedFalse(organizationId, status, pageable)
                    .map(RotationScheduleResponse::fromEntity);
        }
        return rotationRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(RotationScheduleResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public RotationScheduleResponse getById(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        RotationSchedule schedule = getOrThrow(id, organizationId);
        return RotationScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public RotationScheduleResponse create(CreateRotationScheduleRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        RotationSchedule schedule = RotationSchedule.builder()
                .organizationId(organizationId)
                .employeeId(request.employeeId())
                .projectId(request.projectId())
                .shiftStart(request.shiftStart())
                .shiftEnd(request.shiftEnd())
                .workDays(request.workDays())
                .restDays(request.restDays())
                .shiftBonusPercent(request.shiftBonusPercent())
                .status(RotationStatus.PLANNED)
                .notes(request.notes())
                .build();

        schedule = rotationRepository.save(schedule);
        auditService.logCreate("RotationSchedule", schedule.getId());
        log.info("Вахтовый график создан: сотрудник={}, начало={} ({})",
                schedule.getEmployeeId(), schedule.getShiftStart(), schedule.getId());
        return RotationScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public RotationScheduleResponse updateStatus(UUID id, RotationStatus newStatus, String notes) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        RotationSchedule schedule = getOrThrow(id, organizationId);
        RotationStatus old = schedule.getStatus();
        schedule.setStatus(newStatus);
        if (notes != null) schedule.setNotes(notes);
        schedule = rotationRepository.save(schedule);
        auditService.logStatusChange("RotationSchedule", id, old.name(), newStatus.name());
        log.info("Вахтовый график {}: статус {} → {}", id, old, newStatus);
        return RotationScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public void delete(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        RotationSchedule schedule = getOrThrow(id, organizationId);
        schedule.softDelete();
        rotationRepository.save(schedule);
        auditService.logDelete("RotationSchedule", id);
        log.info("Вахтовый график удалён: {}", id);
    }

    /**
     * P1-HR-5: Рассчитывает вахтовую надбавку за период вахты.
     * Надбавка = тарифная ставка × shiftBonusPercent/100 × (workDays + transit days)
     * По умолчанию transit = 0. Минимальный процент: 3% (ст. 302 ТК РФ для районов без
     * районного коэффициента).
     *
     * @param dailyTariffRate дневная тарифная ставка сотрудника
     */
    public BigDecimal calculateShiftBonus(UUID id, BigDecimal dailyTariffRate) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        RotationSchedule schedule = getOrThrow(id, organizationId);

        double bonusPct = schedule.getShiftBonusPercent() != null
                ? Math.max(schedule.getShiftBonusPercent(), 3.0)   // не ниже 3% (ст. 302 ТК РФ)
                : 3.0;

        int days = schedule.getWorkDays() != null ? schedule.getWorkDays() : 0;
        BigDecimal bonus = dailyTariffRate
                .multiply(BigDecimal.valueOf(bonusPct / 100.0))
                .multiply(BigDecimal.valueOf(days))
                .setScale(2, RoundingMode.HALF_UP);

        log.info("Вахтовая надбавка: {}, дней={}, тариф/день={}, %={}, надбавка={}",
                id, days, dailyTariffRate, bonusPct, bonus);
        return bonus;
    }

    private RotationSchedule getOrThrow(UUID id, UUID organizationId) {
        return rotationRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Вахтовый график не найден: " + id));
    }
}
