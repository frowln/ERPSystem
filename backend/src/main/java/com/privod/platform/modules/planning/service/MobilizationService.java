package com.privod.platform.modules.planning.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.planning.domain.MobilizationLine;
import com.privod.platform.modules.planning.domain.MobilizationSchedule;
import com.privod.platform.modules.planning.repository.MobilizationLineRepository;
import com.privod.platform.modules.planning.repository.MobilizationScheduleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MobilizationService {

    private final MobilizationScheduleRepository scheduleRepository;
    private final MobilizationLineRepository lineRepository;

    @Transactional(readOnly = true)
    public List<MobilizationSchedule> listByProject(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return scheduleRepository.findByProjectIdAndOrganizationIdOrderByCreatedAtDesc(projectId, orgId);
    }

    @Transactional(readOnly = true)
    public List<MobilizationLine> getLines(UUID scheduleId) {
        return lineRepository.findByScheduleIdOrderByResourceTypeAscResourceNameAsc(scheduleId);
    }

    @Transactional
    public MobilizationSchedule generate(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        MobilizationSchedule schedule = MobilizationSchedule.builder()
                .organizationId(orgId)
                .projectId(projectId)
                .name("Мобилизация")
                .phase("PRE_MOBILIZATION")
                .totalPersonnelCost(BigDecimal.ZERO)
                .totalEquipmentCost(BigDecimal.ZERO)
                .build();
        schedule = scheduleRepository.save(schedule);

        log.info("Generated mobilization schedule {} for project {}", schedule.getId(), projectId);
        return schedule;
    }

    @Transactional
    public MobilizationLine addLine(UUID scheduleId, MobilizationLine line) {
        line.setScheduleId(scheduleId);
        MobilizationLine saved = lineRepository.save(line);

        // Recalculate totals
        recalculateTotals(scheduleId);

        return saved;
    }

    private void recalculateTotals(UUID scheduleId) {
        List<MobilizationLine> lines = lineRepository.findByScheduleIdOrderByResourceTypeAscResourceNameAsc(scheduleId);
        BigDecimal personnelCost = lines.stream()
                .filter(l -> "PERSONNEL".equals(l.getResourceType()))
                .map(l -> l.getTotalCost() != null ? l.getTotalCost() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal equipmentCost = lines.stream()
                .filter(l -> "EQUIPMENT".equals(l.getResourceType()))
                .map(l -> l.getTotalCost() != null ? l.getTotalCost() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        MobilizationSchedule schedule = scheduleRepository.findById(scheduleId).orElseThrow();
        schedule.setTotalPersonnelCost(personnelCost);
        schedule.setTotalEquipmentCost(equipmentCost);
        scheduleRepository.save(schedule);
    }
}
