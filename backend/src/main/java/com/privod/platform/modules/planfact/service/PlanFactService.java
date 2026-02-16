package com.privod.platform.modules.planfact.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.planfact.domain.PlanFactCategory;
import com.privod.platform.modules.planfact.domain.PlanFactLine;
import com.privod.platform.modules.planfact.repository.PlanFactLineRepository;
import com.privod.platform.modules.planfact.web.dto.PlanFactLineResponse;
import com.privod.platform.modules.planfact.web.dto.PlanFactSummaryResponse;
import com.privod.platform.modules.planfact.web.dto.UpdatePlanFactLineRequest;
import jakarta.persistence.EntityNotFoundException;
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
public class PlanFactService {

    private final PlanFactLineRepository planFactLineRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public List<PlanFactLineResponse> getProjectPlanFact(UUID projectId) {
        return planFactLineRepository.findByProjectIdAndDeletedFalseOrderBySequenceAsc(projectId)
                .stream()
                .map(PlanFactLineResponse::fromEntity)
                .toList();
    }

    @Transactional
    public List<PlanFactLineResponse> generatePlanFactLines(UUID projectId) {
        List<PlanFactLine> existing = planFactLineRepository.findByProjectIdAndDeletedFalseOrderBySequenceAsc(projectId);
        if (!existing.isEmpty()) {
            log.info("План-факт строки уже существуют для проекта {}, пропускаем генерацию", projectId);
            return existing.stream().map(PlanFactLineResponse::fromEntity).toList();
        }

        int seq = 0;
        PlanFactCategory[] categories = PlanFactCategory.values();
        for (PlanFactCategory category : categories) {
            PlanFactLine line = PlanFactLine.builder()
                    .projectId(projectId)
                    .sequence(seq++)
                    .category(category)
                    .planAmount(BigDecimal.ZERO)
                    .factAmount(BigDecimal.ZERO)
                    .build();

            line.computeVariance();
            planFactLineRepository.save(line);
        }

        auditService.logCreate("PlanFact", projectId);
        log.info("План-факт строки сгенерированы для проекта {}: {} категорий", projectId, categories.length);

        return planFactLineRepository.findByProjectIdAndDeletedFalseOrderBySequenceAsc(projectId)
                .stream()
                .map(PlanFactLineResponse::fromEntity)
                .toList();
    }

    @Transactional
    public PlanFactLineResponse updateLine(UUID lineId, UpdatePlanFactLineRequest request) {
        PlanFactLine line = planFactLineRepository.findById(lineId)
                .filter(l -> !l.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Строка план-факта не найдена: " + lineId));

        if (request.planAmount() != null) {
            line.setPlanAmount(request.planAmount());
        }
        if (request.factAmount() != null) {
            line.setFactAmount(request.factAmount());
        }
        if (request.notes() != null) {
            line.setNotes(request.notes());
        }

        line.computeVariance();
        line = planFactLineRepository.save(line);
        auditService.logUpdate("PlanFactLine", line.getId(), "amounts", null, null);

        log.info("Строка план-факта обновлена: {} ({}) - план={}, факт={}",
                line.getCategory(), line.getId(), line.getPlanAmount(), line.getFactAmount());
        return PlanFactLineResponse.fromEntity(line);
    }

    @Transactional(readOnly = true)
    public PlanFactSummaryResponse getProjectSummary(UUID projectId) {
        BigDecimal planRevenue = planFactLineRepository.sumPlanRevenue(projectId);
        BigDecimal factRevenue = planFactLineRepository.sumFactRevenue(projectId);
        BigDecimal planCost = planFactLineRepository.sumPlanCost(projectId);
        BigDecimal factCost = planFactLineRepository.sumFactCost(projectId);

        BigDecimal revenueVariance = factRevenue.subtract(planRevenue);
        BigDecimal costVariance = factCost.subtract(planCost);
        BigDecimal planMargin = planRevenue.subtract(planCost);
        BigDecimal factMargin = factRevenue.subtract(factCost);
        BigDecimal marginVariance = factMargin.subtract(planMargin);

        return new PlanFactSummaryResponse(
                projectId,
                planRevenue,
                factRevenue,
                revenueVariance,
                planCost,
                factCost,
                costVariance,
                planMargin,
                factMargin,
                marginVariance
        );
    }
}
