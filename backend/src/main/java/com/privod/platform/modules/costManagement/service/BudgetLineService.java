package com.privod.platform.modules.costManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.costManagement.domain.BudgetLine;
import com.privod.platform.modules.costManagement.repository.BudgetLineRepository;
import com.privod.platform.modules.costManagement.web.dto.BudgetLineResponse;
import com.privod.platform.modules.costManagement.web.dto.CreateBudgetLineRequest;
import com.privod.platform.modules.costManagement.web.dto.UpdateBudgetLineRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetLineService {

    private final BudgetLineRepository budgetLineRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<BudgetLineResponse> listByProject(UUID projectId, Pageable pageable) {
        return budgetLineRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(BudgetLineResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<BudgetLineResponse> listAllByProject(UUID projectId) {
        return budgetLineRepository.findByProjectIdAndDeletedFalseOrderByCreatedAtAsc(projectId)
                .stream()
                .map(BudgetLineResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public BudgetLineResponse getById(UUID id) {
        BudgetLine budgetLine = getBudgetLineOrThrow(id);
        return BudgetLineResponse.fromEntity(budgetLine);
    }

    @Transactional
    public BudgetLineResponse create(CreateBudgetLineRequest request) {
        budgetLineRepository.findByProjectIdAndCostCodeIdAndDeletedFalse(request.projectId(), request.costCodeId())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException(
                            "Строка бюджета для данного кода затрат уже существует в проекте");
                });

        BudgetLine budgetLine = BudgetLine.builder()
                .projectId(request.projectId())
                .costCodeId(request.costCodeId())
                .description(request.description())
                .originalBudget(request.originalBudget())
                .approvedChanges(request.approvedChanges() != null ? request.approvedChanges() : BigDecimal.ZERO)
                .forecastFinalCost(request.forecastFinalCost())
                .build();

        budgetLine.recalculate();

        budgetLine = budgetLineRepository.save(budgetLine);
        auditService.logCreate("BudgetLine", budgetLine.getId());

        log.info("Budget line created for project {} cost code {} ({})",
                budgetLine.getProjectId(), budgetLine.getCostCodeId(), budgetLine.getId());
        return BudgetLineResponse.fromEntity(budgetLine);
    }

    @Transactional
    public BudgetLineResponse update(UUID id, UpdateBudgetLineRequest request) {
        BudgetLine budgetLine = getBudgetLineOrThrow(id);

        if (request.description() != null) {
            budgetLine.setDescription(request.description());
        }
        if (request.originalBudget() != null) {
            budgetLine.setOriginalBudget(request.originalBudget());
        }
        if (request.approvedChanges() != null) {
            budgetLine.setApprovedChanges(request.approvedChanges());
        }
        if (request.committedCost() != null) {
            budgetLine.setCommittedCost(request.committedCost());
        }
        if (request.actualCost() != null) {
            budgetLine.setActualCost(request.actualCost());
        }
        if (request.forecastFinalCost() != null) {
            budgetLine.setForecastFinalCost(request.forecastFinalCost());
        }

        budgetLine.recalculate();

        budgetLine = budgetLineRepository.save(budgetLine);
        auditService.logUpdate("BudgetLine", budgetLine.getId(), "multiple", null, null);

        log.info("Budget line updated: {}", budgetLine.getId());
        return BudgetLineResponse.fromEntity(budgetLine);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalOriginalBudget(UUID projectId) {
        return budgetLineRepository.sumOriginalBudgetByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalRevisedBudget(UUID projectId) {
        return budgetLineRepository.sumRevisedBudgetByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalActualCost(UUID projectId) {
        return budgetLineRepository.sumActualCostByProjectId(projectId);
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalVariance(UUID projectId) {
        BigDecimal revised = budgetLineRepository.sumRevisedBudgetByProjectId(projectId);
        BigDecimal forecast = budgetLineRepository.sumForecastFinalCostByProjectId(projectId);
        return revised.subtract(forecast);
    }

    @Transactional
    public void delete(UUID id) {
        BudgetLine budgetLine = getBudgetLineOrThrow(id);
        budgetLine.softDelete();
        budgetLineRepository.save(budgetLine);
        auditService.logDelete("BudgetLine", id);

        log.info("Budget line deleted: {}", id);
    }

    private BudgetLine getBudgetLineOrThrow(UUID id) {
        return budgetLineRepository.findById(id)
                .filter(bl -> !bl.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Строка бюджета не найдена: " + id));
    }
}
