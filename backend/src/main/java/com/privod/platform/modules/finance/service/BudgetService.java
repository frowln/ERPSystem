package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.BudgetStatus;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.web.dto.BudgetItemResponse;
import com.privod.platform.modules.finance.web.dto.BudgetResponse;
import com.privod.platform.modules.finance.web.dto.BudgetSummaryResponse;
import com.privod.platform.modules.finance.web.dto.CreateBudgetItemRequest;
import com.privod.platform.modules.finance.web.dto.CreateBudgetRequest;
import com.privod.platform.modules.finance.web.dto.UpdateBudgetRequest;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final BudgetItemRepository budgetItemRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<BudgetResponse> listBudgets(UUID projectId, BudgetStatus status, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Page<Budget> page;
        if (projectId != null) {
            validateProjectTenant(projectId, organizationId);
            page = budgetRepository.findByProjectIdAndDeletedFalse(projectId, pageable);
        } else if (status != null) {
            List<UUID> projectIds = getOrganizationProjectIds(organizationId);
            if (projectIds.isEmpty()) {
                return Page.empty(pageable);
            }
            page = budgetRepository.findByProjectIdInAndStatusAndDeletedFalse(projectIds, status, pageable);
        } else {
            List<UUID> projectIds = getOrganizationProjectIds(organizationId);
            if (projectIds.isEmpty()) {
                return Page.empty(pageable);
            }
            page = budgetRepository.findByProjectIdInAndDeletedFalse(projectIds, pageable);
        }
        return enrichBudgetsWithProjectName(page);
    }

    /**
     * Batch-resolve project names for a page of budgets to avoid N+1 queries.
     */
    private Page<BudgetResponse> enrichBudgetsWithProjectName(Page<Budget> page) {
        List<UUID> projectIds = page.getContent().stream()
                .map(Budget::getProjectId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();

        Map<UUID, String> projectNameMap = resolveProjectNames(projectIds);

        List<BudgetResponse> enriched = page.getContent().stream()
                .map(budget -> BudgetResponse.fromEntity(
                        budget,
                        budget.getProjectId() != null ? projectNameMap.get(budget.getProjectId()) : null))
                .toList();

        return new PageImpl<>(enriched, page.getPageable(), page.getTotalElements());
    }

    private Map<UUID, String> resolveProjectNames(List<UUID> projectIds) {
        if (projectIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> map = new HashMap<>();
        for (Object[] row : projectRepository.findNamesByIds(projectIds)) {
            map.put((UUID) row[0], (String) row[1]);
        }
        return map;
    }

    @Transactional(readOnly = true)
    public BudgetResponse getBudget(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Budget budget = getBudgetOrThrow(id, organizationId);
        return BudgetResponse.fromEntity(budget);
    }

    @Transactional
    public BudgetResponse createBudget(CreateBudgetRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (request.projectId() == null) {
            throw new IllegalArgumentException("Проект обязателен для бюджета");
        }
        validateProjectTenant(request.projectId(), organizationId);

        BigDecimal plannedRevenue = request.plannedRevenue() != null ? request.plannedRevenue() : BigDecimal.ZERO;
        BigDecimal plannedCost = request.plannedCost() != null ? request.plannedCost() : BigDecimal.ZERO;
        BigDecimal plannedMargin = request.plannedMargin() != null
                ? request.plannedMargin()
                : plannedRevenue.subtract(plannedCost);

        Budget budget = Budget.builder()
                .name(request.name())
                .projectId(request.projectId())
                .contractId(request.contractId())
                .status(BudgetStatus.DRAFT)
                .plannedRevenue(plannedRevenue)
                .plannedCost(plannedCost)
                .plannedMargin(plannedMargin)
                .notes(request.notes())
                .build();

        budget = budgetRepository.save(budget);
        auditService.logCreate("Budget", budget.getId());

        log.info("Бюджет создан: {} ({})", budget.getName(), budget.getId());
        return BudgetResponse.fromEntity(budget);
    }

    @Transactional
    public BudgetResponse updateBudget(UUID id, UpdateBudgetRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Budget budget = getBudgetOrThrow(id, organizationId);

        if (budget.getStatus() != BudgetStatus.DRAFT) {
            throw new IllegalStateException("Редактирование бюджета возможно только в статусе Черновик");
        }

        if (request.name() != null) {
            budget.setName(request.name());
        }
        if (request.projectId() != null) {
            validateProjectTenant(request.projectId(), organizationId);
            budget.setProjectId(request.projectId());
        }
        if (request.contractId() != null) {
            budget.setContractId(request.contractId());
        }
        if (request.plannedRevenue() != null) {
            budget.setPlannedRevenue(request.plannedRevenue());
        }
        if (request.plannedCost() != null) {
            budget.setPlannedCost(request.plannedCost());
        }
        if (request.plannedMargin() != null) {
            budget.setPlannedMargin(request.plannedMargin());
        }
        if (request.notes() != null) {
            budget.setNotes(request.notes());
        }

        budget = budgetRepository.save(budget);
        auditService.logUpdate("Budget", budget.getId(), "multiple", null, null);

        log.info("Бюджет обновлён: {} ({})", budget.getName(), budget.getId());
        return BudgetResponse.fromEntity(budget);
    }

    @Transactional
    public BudgetResponse approveBudget(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Budget budget = getBudgetOrThrow(id, organizationId);
        BudgetStatus oldStatus = budget.getStatus();

        if (!budget.canTransitionTo(BudgetStatus.APPROVED)) {
            throw new IllegalStateException(
                    String.format("Невозможно утвердить бюджет из статуса %s", oldStatus.getDisplayName()));
        }

        budget.setStatus(BudgetStatus.APPROVED);
        budget = budgetRepository.save(budget);
        auditService.logStatusChange("Budget", budget.getId(), oldStatus.name(), BudgetStatus.APPROVED.name());

        log.info("Бюджет утверждён: {} ({})", budget.getName(), budget.getId());
        return BudgetResponse.fromEntity(budget);
    }

    @Transactional
    public BudgetResponse activateBudget(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Budget budget = getBudgetOrThrow(id, organizationId);
        BudgetStatus oldStatus = budget.getStatus();

        if (!budget.canTransitionTo(BudgetStatus.ACTIVE)) {
            throw new IllegalStateException(
                    String.format("Невозможно активировать бюджет из статуса %s", oldStatus.getDisplayName()));
        }

        budget.setStatus(BudgetStatus.ACTIVE);
        budget = budgetRepository.save(budget);
        auditService.logStatusChange("Budget", budget.getId(), oldStatus.name(), BudgetStatus.ACTIVE.name());

        log.info("Бюджет активирован: {} ({})", budget.getName(), budget.getId());
        return BudgetResponse.fromEntity(budget);
    }

    @Transactional
    public BudgetResponse freezeBudget(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Budget budget = getBudgetOrThrow(id, organizationId);
        BudgetStatus oldStatus = budget.getStatus();

        if (!budget.canTransitionTo(BudgetStatus.FROZEN)) {
            throw new IllegalStateException(
                    String.format("Невозможно заморозить бюджет из статуса %s", oldStatus.getDisplayName()));
        }

        budget.setStatus(BudgetStatus.FROZEN);
        budget = budgetRepository.save(budget);
        auditService.logStatusChange("Budget", budget.getId(), oldStatus.name(), BudgetStatus.FROZEN.name());

        log.info("Бюджет заморожен: {} ({})", budget.getName(), budget.getId());
        return BudgetResponse.fromEntity(budget);
    }

    @Transactional
    public BudgetResponse closeBudget(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Budget budget = getBudgetOrThrow(id, organizationId);
        BudgetStatus oldStatus = budget.getStatus();

        if (!budget.canTransitionTo(BudgetStatus.CLOSED)) {
            throw new IllegalStateException(
                    String.format("Невозможно закрыть бюджет из статуса %s", oldStatus.getDisplayName()));
        }

        budget.setStatus(BudgetStatus.CLOSED);
        budget = budgetRepository.save(budget);
        auditService.logStatusChange("Budget", budget.getId(), oldStatus.name(), BudgetStatus.CLOSED.name());

        log.info("Бюджет закрыт: {} ({})", budget.getName(), budget.getId());
        return BudgetResponse.fromEntity(budget);
    }

    @Transactional
    public BudgetResponse recalculateActuals(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Budget budget = getBudgetOrThrow(id, organizationId);

        List<BudgetItem> items = budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(id);

        BigDecimal totalActualCost = items.stream()
                .map(item -> item.getActualAmount() != null ? item.getActualAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        budget.setActualCost(totalActualCost);
        budget.setActualMargin(budget.getActualRevenue().subtract(totalActualCost));

        budget = budgetRepository.save(budget);

        log.info("Фактические данные бюджета пересчитаны: {} ({})", budget.getName(), budget.getId());
        return BudgetResponse.fromEntity(budget);
    }

    @Transactional(readOnly = true)
    public BudgetSummaryResponse getProjectBudgetSummary(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);
        long totalBudgets = budgetRepository.countByProjectIdAndDeletedFalse(projectId);
        BigDecimal totalPlannedRevenue = budgetRepository.sumPlannedRevenueByProjectId(projectId);
        BigDecimal totalPlannedCost = budgetRepository.sumPlannedCostByProjectId(projectId);
        BigDecimal totalActualRevenue = budgetRepository.sumActualRevenueByProjectId(projectId);
        BigDecimal totalActualCost = budgetRepository.sumActualCostByProjectId(projectId);

        return new BudgetSummaryResponse(
                totalBudgets,
                totalPlannedRevenue != null ? totalPlannedRevenue : BigDecimal.ZERO,
                totalPlannedCost != null ? totalPlannedCost : BigDecimal.ZERO,
                totalActualRevenue != null ? totalActualRevenue : BigDecimal.ZERO,
                totalActualCost != null ? totalActualCost : BigDecimal.ZERO
        );
    }

    // === Budget Items ===

    @Transactional(readOnly = true)
    public List<BudgetItemResponse> getBudgetItems(UUID budgetId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getBudgetOrThrow(budgetId, organizationId);
        return budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budgetId)
                .stream()
                .map(BudgetItemResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BudgetItemResponse addBudgetItem(UUID budgetId, CreateBudgetItemRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getBudgetOrThrow(budgetId, organizationId);

        BudgetItem item = BudgetItem.builder()
                .budgetId(budgetId)
                .sequence(request.sequence() != null ? request.sequence() : 0)
                .category(request.category())
                .name(request.name())
                .plannedAmount(request.plannedAmount())
                .notes(request.notes())
                .build();

        item.setRemainingAmount(item.calculateRemainingAmount());
        item = budgetItemRepository.save(item);
        auditService.logCreate("BudgetItem", item.getId());

        log.info("Статья бюджета добавлена: {} в бюджет {}", item.getName(), budgetId);
        return BudgetItemResponse.fromEntity(item);
    }

    @Transactional
    public void deleteBudgetItem(UUID budgetId, UUID itemId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getBudgetOrThrow(budgetId, organizationId);
        BudgetItem item = budgetItemRepository.findById(itemId)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Статья бюджета не найдена: " + itemId));

        if (!item.getBudgetId().equals(budgetId)) {
            throw new IllegalArgumentException("Статья не принадлежит указанному бюджету");
        }

        item.softDelete();
        budgetItemRepository.save(item);
        auditService.logDelete("BudgetItem", itemId);

        log.info("Статья бюджета удалена: {} из бюджета {}", itemId, budgetId);
    }

    private Budget getBudgetOrThrow(UUID id, UUID organizationId) {
        Budget budget = budgetRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Бюджет не найден: " + id));
        validateProjectTenant(budget.getProjectId(), organizationId);
        return budget;
    }

    private List<UUID> getOrganizationProjectIds(UUID organizationId) {
        return projectRepository.findAllIdsByOrganizationIdAndDeletedFalse(organizationId);
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) {
            throw new EntityNotFoundException("Проект не найден: null");
        }
        projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .filter(p -> organizationId.equals(p.getOrganizationId()))
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
    }
}
