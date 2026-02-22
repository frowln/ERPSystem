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
import com.privod.platform.modules.finance.web.dto.FinanceExpenseItemResponse;
import com.privod.platform.modules.finance.web.dto.UpdateBudgetItemRequest;
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
                .organizationId(organizationId)
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

    @Transactional(readOnly = true)
    public List<BudgetItem> getBudgetItemEntities(UUID budgetId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getBudgetOrThrow(budgetId, organizationId);
        return budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budgetId);
    }

    @Transactional
    public BudgetItemResponse addBudgetItem(UUID budgetId, CreateBudgetItemRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getBudgetOrThrow(budgetId, organizationId);

        BudgetItem item = BudgetItem.builder()
                .budgetId(budgetId)
                .sequence(request.sequence() != null ? request.sequence() : 0)
                .parentId(request.parentId())
                .section(request.section() != null
                        ? request.section()
                        : request.plannedAmount() != null && request.plannedAmount().compareTo(BigDecimal.ZERO) == 0)
                .category(request.category())
                .itemType(request.itemType())
                .name(request.name())
                .quantity(request.quantity())
                .unit(request.unit())
                .disciplineMark(request.disciplineMark())
                .costPrice(request.costPrice())
                .estimatePrice(request.estimatePrice())
                .coefficient(request.coefficient())
                .salePrice(request.customerPrice())
                .customerPrice(request.customerPrice())
                .vatRate(request.vatRate())
                .docStatus(request.docStatus())
                .priceSourceType(request.priceSourceType())
                .priceSourceId(request.priceSourceId())
                .plannedAmount(request.plannedAmount())
                .sectionId(request.sectionId())
                .notes(request.notes())
                .build();

        validateCustomerPrice(item.getCustomerPrice(), item.getEstimatePrice());
        if (item.getDocStatus() == null) {
            item.setDocStatus(com.privod.platform.modules.finance.domain.BudgetItemDocStatus.PLANNED);
        }
        item.setCustomerTotal(calculateCustomerTotal(item.getCustomerPrice(), item.getQuantity()));
        item.setRemainingAmount(item.calculateRemainingAmount());
        item.recalculateMargin();
        item = budgetItemRepository.save(item);
        auditService.logCreate("BudgetItem", item.getId());

        log.info("Статья бюджета добавлена: {} в бюджет {}", item.getName(), budgetId);
        return BudgetItemResponse.fromEntity(item);
    }

    @Transactional
    public BudgetItemResponse updateBudgetItem(UUID budgetId, UUID itemId, UpdateBudgetItemRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getBudgetOrThrow(budgetId, organizationId);

        BudgetItem item = budgetItemRepository.findById(itemId)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Статья бюджета не найдена: " + itemId));
        if (!item.getBudgetId().equals(budgetId)) {
            throw new IllegalArgumentException("Статья не принадлежит указанному бюджету");
        }

        if (request.sequence() != null) {
            item.setSequence(request.sequence());
        }
        if (request.parentId() != null) {
            item.setParentId(request.parentId());
        }
        if (request.category() != null) {
            item.setCategory(request.category());
        }
        if (request.itemType() != null) {
            item.setItemType(request.itemType());
        }
        if (request.name() != null) {
            item.setName(request.name());
        }
        if (request.quantity() != null) {
            item.setQuantity(request.quantity());
        }
        if (request.unit() != null) {
            item.setUnit(request.unit());
        }
        if (request.costPrice() != null) {
            item.setCostPrice(request.costPrice());
        }
        if (request.estimatePrice() != null) {
            item.setEstimatePrice(request.estimatePrice());
        }
        if (request.coefficient() != null) {
            item.setCoefficient(request.coefficient());
        }
        if (request.vatRate() != null) {
            item.setVatRate(request.vatRate());
        }
        if (request.plannedAmount() != null) {
            item.setPlannedAmount(request.plannedAmount());
        }
        if (request.customerPrice() != null) {
            item.setSalePrice(request.customerPrice());
            item.setCustomerPrice(request.customerPrice());
        }
        if (request.sectionId() != null) {
            item.setSectionId(request.sectionId());
        }
        if (request.docStatus() != null) {
            item.setDocStatus(request.docStatus());
        }
        if (request.priceSourceType() != null || request.priceSourceId() != null) {
            item.setPriceSourceType(request.priceSourceType());
            item.setPriceSourceId(request.priceSourceId());
        }
        if (request.notes() != null) {
            item.setNotes(request.notes());
        }
        if (request.disciplineMark() != null) {
            item.setDisciplineMark(request.disciplineMark());
        }

        validateCustomerPrice(item.getCustomerPrice(), item.getEstimatePrice());
        item.setCustomerTotal(calculateCustomerTotal(item.getCustomerPrice(), item.getQuantity()));
        if (item.getPlannedAmount() == null) {
            item.setPlannedAmount(BigDecimal.ZERO);
        }
        item.setRemainingAmount(item.calculateRemainingAmount());
        item.recalculateMargin();

        item = budgetItemRepository.save(item);
        auditService.logUpdate("BudgetItem", itemId, "multiple", null, null);

        log.info("Статья бюджета обновлена: {} в бюджете {}", itemId, budgetId);
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

    private void validateCustomerPrice(BigDecimal customerPrice, BigDecimal estimatePrice) {
        if (customerPrice == null || estimatePrice == null) {
            return;
        }
        if (customerPrice.compareTo(estimatePrice) > 0) {
            throw new IllegalArgumentException("Цена заказчику не должна превышать сметную цену");
        }
    }

    private BigDecimal calculateCustomerTotal(BigDecimal customerPrice, BigDecimal quantity) {
        if (customerPrice == null || quantity == null) {
            return null;
        }
        return customerPrice.multiply(quantity).setScale(2, java.math.RoundingMode.HALF_UP);
    }

    @Transactional(readOnly = true)
    public Page<FinanceExpenseItemResponse> getExpenses(UUID projectId, UUID budgetId,
                                                         String disciplineMark, String docStatus,
                                                         Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        // Get budgets for this org's projects
        List<UUID> orgProjectIds = getOrganizationProjectIds(organizationId);
        if (orgProjectIds.isEmpty()) {
            return Page.empty(pageable);
        }

        List<Budget> budgets;
        if (budgetId != null) {
            budgets = budgetRepository.findById(budgetId)
                    .filter(b -> !b.isDeleted())
                    .map(List::of)
                    .orElse(List.of());
        } else if (projectId != null) {
            budgets = budgetRepository.findByProjectIdAndDeletedFalse(projectId, Pageable.unpaged()).getContent();
        } else {
            budgets = budgetRepository.findByProjectIdInAndDeletedFalse(orgProjectIds, Pageable.unpaged()).getContent();
        }

        if (budgets.isEmpty()) {
            return Page.empty(pageable);
        }

        // Build budget ID to name/project maps
        Map<UUID, String> budgetNames = new HashMap<>();
        Map<UUID, UUID> budgetProjectIds = new HashMap<>();
        for (Budget b : budgets) {
            budgetNames.put(b.getId(), b.getName());
            budgetProjectIds.put(b.getId(), b.getProjectId());
        }

        // Resolve project names
        List<UUID> allProjectIds = budgets.stream()
                .map(Budget::getProjectId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        Map<UUID, String> projectNames = resolveProjectNames(allProjectIds);

        // Get all non-section budget items from these budgets
        List<UUID> budgetIds = budgets.stream().map(Budget::getId).toList();
        List<BudgetItem> allItems = budgetIds.stream()
                .flatMap(bId -> budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(bId).stream())
                .filter(item -> !item.isSection())
                .toList();

        // Apply filters
        List<BudgetItem> filtered = allItems;
        if (disciplineMark != null && !disciplineMark.isBlank()) {
            filtered = filtered.stream()
                    .filter(item -> disciplineMark.equals(item.getDisciplineMark()))
                    .toList();
        }
        if (docStatus != null && !docStatus.isBlank()) {
            filtered = filtered.stream()
                    .filter(item -> item.getDocStatus() != null && docStatus.equals(item.getDocStatus().name()))
                    .toList();
        }

        // Paginate manually
        int total = filtered.size();
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), total);
        List<BudgetItem> pageItems = start < total ? filtered.subList(start, end) : List.of();

        List<FinanceExpenseItemResponse> responseItems = pageItems.stream()
                .map(item -> FinanceExpenseItemResponse.of(
                        item,
                        budgetNames.get(item.getBudgetId()),
                        budgetProjectIds.get(item.getBudgetId()),
                        projectNames.getOrDefault(budgetProjectIds.get(item.getBudgetId()), ""),
                        null, null, null, null, null))
                .toList();

        return new PageImpl<>(responseItems, pageable, total);
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
