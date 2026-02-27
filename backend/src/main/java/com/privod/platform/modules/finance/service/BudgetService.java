package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.BudgetItemPriceSource;
import com.privod.platform.modules.finance.domain.BudgetSnapshot;
import com.privod.platform.modules.finance.domain.BudgetStatus;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.BudgetSnapshotRepository;
import com.privod.platform.modules.finance.web.dto.BudgetItemResponse;
import com.privod.platform.modules.finance.web.dto.BudgetResponse;
import com.privod.platform.modules.finance.web.dto.BudgetSummaryResponse;
import com.privod.platform.modules.finance.web.dto.CreateBudgetItemRequest;
import com.privod.platform.modules.finance.web.dto.CreateBudgetRequest;
import com.privod.platform.modules.finance.web.dto.FinanceExpenseItemResponse;
import com.privod.platform.modules.finance.web.dto.UpdateBudgetItemRequest;
import com.privod.platform.modules.finance.web.dto.UpdateBudgetRequest;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.specification.domain.SpecItemType;
import com.privod.platform.modules.specification.repository.SpecItemRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
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
    private final BudgetSnapshotRepository snapshotRepository;
    private final ProjectRepository projectRepository;
    private final com.privod.platform.modules.estimate.repository.EstimateRepository estimateRepository;
    private final com.privod.platform.modules.estimate.repository.EstimateItemRepository estimateItemRepository;
    private final BudgetSnapshotService budgetSnapshotService;
    private final SpecItemRepository specItemRepository;
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

        if (snapshotRepository.findFirstByBudgetIdAndSnapshotTypeAndDeletedFalseOrderBySnapshotDateDesc(
                budget.getId(),
                BudgetSnapshot.SnapshotType.BASELINE
        ).isEmpty()) {
            budgetSnapshotService.createSnapshot(
                    budget.getId(),
                    "BASELINE " + Instant.now(),
                    BudgetSnapshot.SnapshotType.BASELINE,
                    null,
                    "Автосоздано при утверждении бюджета"
            );
        }

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

        BudgetItemPriceSource resolvedPriceSourceType = request.priceSourceType();
        if (request.costPrice() != null) {
            validateManualCostPriceSource(resolvedPriceSourceType);
            if (resolvedPriceSourceType == null) {
                resolvedPriceSourceType = BudgetItemPriceSource.MANUAL;
            }
        }

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
                .priceSourceType(resolvedPriceSourceType)
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
        BudgetItemPriceSource effectivePriceSource = request.priceSourceType() != null
                ? request.priceSourceType()
                : item.getPriceSourceType();
        if (request.costPrice() != null) {
            validateManualCostPriceSource(effectivePriceSource);
            item.setCostPrice(request.costPrice());
            if (effectivePriceSource == null) {
                item.setPriceSourceType(BudgetItemPriceSource.MANUAL);
                item.setPriceSourceId(null);
            }
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
    public List<BudgetItemResponse> importFromEstimate(UUID budgetId, UUID estimateId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Budget budget = getBudgetOrThrow(budgetId, organizationId);

        com.privod.platform.modules.estimate.domain.Estimate estimate = estimateRepository.findById(estimateId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Смета не найдена: " + estimateId));

        if (!organizationId.equals(estimate.getOrganizationId())) {
            throw new EntityNotFoundException("Смета не найдена: " + estimateId);
        }

        if (budget.getProjectId() != null && estimate.getProjectId() != null
                && !budget.getProjectId().equals(estimate.getProjectId())) {
            throw new IllegalArgumentException("Смета относится к другому проекту");
        }

        List<com.privod.platform.modules.estimate.domain.EstimateItem> estimateItems = estimateItemRepository
                .findByEstimateIdAndDeletedFalseOrderBySequenceAsc(estimateId);

        int maxSequence = budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budgetId).stream()
                .mapToInt(i -> i.getSequence() != null ? i.getSequence() : 0)
                .max().orElse(0);

        List<BudgetItem> newItems = new java.util.ArrayList<>();
        for (com.privod.platform.modules.estimate.domain.EstimateItem estItem : estimateItems) {
            maxSequence++;
            BigDecimal price = estItem.getUnitPrice() != null ? estItem.getUnitPrice() : BigDecimal.ZERO;
            BigDecimal qty = estItem.getQuantity() != null ? estItem.getQuantity() : BigDecimal.ONE;

            var budgetItemType = com.privod.platform.modules.finance.domain.BudgetItemType.WORKS;
            var budgetCategory = com.privod.platform.modules.finance.domain.BudgetCategory.LABOR;
            if (estItem.getSpecItemId() != null) {
                var specItem = specItemRepository.findById(estItem.getSpecItemId()).orElse(null);
                if (specItem != null && specItem.getItemType() != null) {
                    switch (specItem.getItemType()) {
                        case MATERIAL -> { budgetItemType = com.privod.platform.modules.finance.domain.BudgetItemType.MATERIALS; budgetCategory = com.privod.platform.modules.finance.domain.BudgetCategory.MATERIALS; }
                        case EQUIPMENT -> { budgetItemType = com.privod.platform.modules.finance.domain.BudgetItemType.EQUIPMENT; budgetCategory = com.privod.platform.modules.finance.domain.BudgetCategory.EQUIPMENT; }
                        case WORK -> { budgetItemType = com.privod.platform.modules.finance.domain.BudgetItemType.WORKS; budgetCategory = com.privod.platform.modules.finance.domain.BudgetCategory.LABOR; }
                    }
                }
            }

            BudgetItem bi = BudgetItem.builder()
                    .budgetId(budgetId)
                    .sequence(maxSequence)
                    .name(estItem.getName())
                    .quantity(qty)
                    .unit(estItem.getUnitOfMeasure())
                    .costPrice(price)
                    .estimatePrice(price)
                    .salePrice(price)
                    .customerPrice(price)
                    .itemType(budgetItemType)
                    .category(budgetCategory)
                    .plannedAmount(price.multiply(qty).setScale(2, RoundingMode.HALF_UP))
                    .priceSourceType(com.privod.platform.modules.finance.domain.BudgetItemPriceSource.ESTIMATE)
                    .priceSourceId(estItem.getId())
                    .docStatus(com.privod.platform.modules.finance.domain.BudgetItemDocStatus.PLANNED)
                    .notes(estItem.getNotes())
                    .build();

            bi.setCustomerTotal(bi.getPlannedAmount());
            bi.setRemainingAmount(bi.getPlannedAmount());
            bi.recalculateMargin();
            bi.recalculatePrices();
            newItems.add(budgetItemRepository.save(bi));
        }

        auditService.logUpdate("Budget", budgetId, "importFromEstimate", null, "Imported " + newItems.size() + " items");
        log.info("Импортировано {} позиций из сметы {} в бюджет {}", newItems.size(), estimateId, budgetId);

        return newItems.stream().map(BudgetItemResponse::fromEntity).toList();
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

    private void validateManualCostPriceSource(BudgetItemPriceSource priceSourceType) {
        if (priceSourceType != null && priceSourceType != BudgetItemPriceSource.MANUAL) {
            throw new IllegalStateException(
                    "Себестоимость можно редактировать вручную только для позиций с источником цены MANUAL");
        }
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

    // ======================== Own Cost Generation (Phase 8) ========================

    @Transactional
    public List<BudgetItemResponse> generateOwnCostLines(UUID budgetId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Budget budget = getBudgetOrThrow(budgetId, organizationId);
        List<BudgetItem> existingItems = budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budgetId);

        // Sum direct costs (MATERIALS + WORKS + EQUIPMENT non-section items)
        BigDecimal totalDirectCost = existingItems.stream()
                .filter(i -> !i.isSection())
                .map(i -> {
                    BigDecimal cost = i.getCostPrice() != null ? i.getCostPrice() : BigDecimal.ZERO;
                    BigDecimal qty = i.getQuantity() != null ? i.getQuantity() : BigDecimal.ONE;
                    return cost.multiply(qty);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int nextSeq = existingItems.stream().mapToInt(i -> i.getSequence() != null ? i.getSequence() : 0).max().orElse(0) + 1;

        java.util.ArrayList<BudgetItem> newItems = new java.util.ArrayList<>();

        // Overhead
        BigDecimal overheadPct = budget.getOverheadPercent() != null ? budget.getOverheadPercent() : new BigDecimal("12.00");
        BigDecimal overheadAmount = totalDirectCost.multiply(overheadPct).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        newItems.add(BudgetItem.builder()
                .budgetId(budgetId).sequence(nextSeq++).category(com.privod.platform.modules.finance.domain.BudgetCategory.OVERHEAD)
                .name("Накладные расходы (" + overheadPct + "%)").plannedAmount(overheadAmount)
                .costPrice(overheadAmount).quantity(BigDecimal.ONE).unit("компл.").build());

        // Contingency reserve
        BigDecimal contingencyPct = budget.getContingencyPercent() != null ? budget.getContingencyPercent() : new BigDecimal("5.00");
        BigDecimal contingencyAmount = totalDirectCost.multiply(contingencyPct).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        newItems.add(BudgetItem.builder()
                .budgetId(budgetId).sequence(nextSeq++).category(com.privod.platform.modules.finance.domain.BudgetCategory.OTHER)
                .name("Резерв непредвиденных расходов (" + contingencyPct + "%)").plannedAmount(contingencyAmount)
                .costPrice(contingencyAmount).quantity(BigDecimal.ONE).unit("компл.").build());

        // Temporary structures
        BigDecimal tempPct = budget.getTempStructuresPercent() != null ? budget.getTempStructuresPercent() : new BigDecimal("3.00");
        BigDecimal tempAmount = totalDirectCost.multiply(tempPct).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        newItems.add(BudgetItem.builder()
                .budgetId(budgetId).sequence(nextSeq++).category(com.privod.platform.modules.finance.domain.BudgetCategory.OTHER)
                .name("Временные здания и сооружения (" + tempPct + "%)").plannedAmount(tempAmount)
                .costPrice(tempAmount).quantity(BigDecimal.ONE).unit("компл.").build());

        List<BudgetItem> saved = budgetItemRepository.saveAll(newItems);
        log.info("Generated {} own-cost lines for budget {}", saved.size(), budgetId);
        return saved.stream().map(BudgetItemResponse::fromEntity).toList();
    }

    // ======================== ROI Calculation (Phase 9) ========================

    @Transactional(readOnly = true)
    public Map<String, Object> calculateROI(UUID budgetId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Budget budget = getBudgetOrThrow(budgetId, organizationId);
        List<BudgetItem> items = budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budgetId);

        BigDecimal totalCost = items.stream().filter(i -> !i.isSection())
                .map(i -> {
                    BigDecimal c = i.getCostPrice() != null ? i.getCostPrice() : BigDecimal.ZERO;
                    BigDecimal q = i.getQuantity() != null ? i.getQuantity() : BigDecimal.ONE;
                    return c.multiply(q);
                }).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalRevenue = items.stream().filter(i -> !i.isSection())
                .map(i -> {
                    BigDecimal c = i.getCustomerPrice() != null ? i.getCustomerPrice() : BigDecimal.ZERO;
                    BigDecimal q = i.getQuantity() != null ? i.getQuantity() : BigDecimal.ONE;
                    return c.multiply(q);
                }).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal margin = totalRevenue.subtract(totalCost);
        BigDecimal marginPct = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                ? margin.multiply(new BigDecimal("100")).divide(totalRevenue, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // ROI = margin / totalCost * 100
        BigDecimal roi = totalCost.compareTo(BigDecimal.ZERO) > 0
                ? margin.multiply(new BigDecimal("100")).divide(totalCost, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        Map<String, Object> result = new HashMap<>();
        result.put("totalCost", totalCost);
        result.put("totalRevenue", totalRevenue);
        result.put("margin", margin);
        result.put("marginPercent", marginPct);
        result.put("roi", roi);
        return result;
    }

    // ======================== Margin Scenario Simulation (Phase 9) ========================

    @Transactional(readOnly = true)
    public Map<String, Object> simulateMarginScenario(UUID budgetId, BigDecimal targetMarginPercent) {
        List<BudgetItem> items = budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budgetId);

        BigDecimal totalCost = items.stream().filter(i -> !i.isSection())
                .map(i -> {
                    BigDecimal c = i.getCostPrice() != null ? i.getCostPrice() : BigDecimal.ZERO;
                    BigDecimal q = i.getQuantity() != null ? i.getQuantity() : BigDecimal.ONE;
                    return c.multiply(q);
                }).reduce(BigDecimal.ZERO, BigDecimal::add);

        // targetRevenue = totalCost / (1 - targetMargin/100)
        BigDecimal marginFraction = targetMarginPercent.divide(new BigDecimal("100"), 6, RoundingMode.HALF_UP);
        BigDecimal denominator = BigDecimal.ONE.subtract(marginFraction);
        BigDecimal targetRevenue = denominator.compareTo(BigDecimal.ZERO) > 0
                ? totalCost.divide(denominator, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BigDecimal currentRevenue = items.stream().filter(i -> !i.isSection())
                .map(i -> {
                    BigDecimal c = i.getCustomerPrice() != null ? i.getCustomerPrice() : BigDecimal.ZERO;
                    BigDecimal q = i.getQuantity() != null ? i.getQuantity() : BigDecimal.ONE;
                    return c.multiply(q);
                }).reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal revenueDelta = targetRevenue.subtract(currentRevenue);
        BigDecimal targetMargin = targetRevenue.subtract(totalCost);

        Map<String, Object> result = new HashMap<>();
        result.put("currentRevenue", currentRevenue);
        result.put("targetRevenue", targetRevenue);
        result.put("revenueDelta", revenueDelta);
        result.put("targetMargin", targetMargin);
        result.put("targetMarginPercent", targetMarginPercent);
        result.put("totalCost", totalCost);
        return result;
    }
}
