package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.finance.VatCalculator;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.CashFlowCategory;
import com.privod.platform.modules.finance.domain.CashFlowEntry;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.contractExt.domain.ContractMilestone;
import com.privod.platform.modules.contractExt.repository.ContractMilestoneRepository;
import com.privod.platform.modules.finance.domain.Payment;
import com.privod.platform.modules.finance.domain.PaymentStatus;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.CashFlowEntryRepository;
import com.privod.platform.modules.finance.repository.PaymentRepository;
import com.privod.platform.modules.finance.web.dto.CashFlowEntryResponse;
import com.privod.platform.modules.finance.web.dto.CashFlowSummaryResponse;
import com.privod.platform.modules.finance.web.dto.CreateCashFlowEntryRequest;
import com.privod.platform.modules.project.repository.ProjectRepository;

import java.math.RoundingMode;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CashFlowService {

    private final CashFlowEntryRepository cashFlowEntryRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetItemRepository budgetItemRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;
    // P1-FIN-3: Прогноз из контрактных графиков и фактических платежей
    private final ContractRepository contractRepository;
    private final ContractMilestoneRepository contractMilestoneRepository;
    private final PaymentRepository paymentRepository;

    @Transactional(readOnly = true)
    public Page<CashFlowEntryResponse> listEntries(UUID projectId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (projectId != null) {
            validateProjectTenant(projectId, organizationId);
            return cashFlowEntryRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(CashFlowEntryResponse::fromEntity);
        }
        List<UUID> projectIds = getOrganizationProjectIds(organizationId);
        if (projectIds.isEmpty()) {
            return Page.empty(pageable);
        }
        return cashFlowEntryRepository.findByProjectIdInAndDeletedFalse(projectIds, pageable)
                .map(CashFlowEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CashFlowEntryResponse getEntry(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        CashFlowEntry entry = getEntryOrThrow(id, organizationId);
        return CashFlowEntryResponse.fromEntity(entry);
    }

    @Transactional
    public CashFlowEntryResponse createEntry(CreateCashFlowEntryRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (request.projectId() == null) {
            throw new IllegalArgumentException("Проект обязателен для движения ДДС");
        }
        validateProjectTenant(request.projectId(), organizationId);

        CashFlowEntry entry = CashFlowEntry.builder()
                .projectId(request.projectId())
                .entryDate(request.entryDate())
                .direction(request.direction())
                .category(request.category())
                .amount(request.amount())
                .description(request.description())
                .paymentId(request.paymentId())
                .invoiceId(request.invoiceId())
                .notes(request.notes())
                .build();

        entry = cashFlowEntryRepository.save(entry);
        auditService.logCreate("CashFlowEntry", entry.getId());

        log.info("Запись движения денежных средств создана: {} {} ({})",
                entry.getDirection(), entry.getAmount(), entry.getId());
        return CashFlowEntryResponse.fromEntity(entry);
    }

    @Transactional
    public void deleteEntry(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        CashFlowEntry entry = getEntryOrThrow(id, organizationId);
        entry.softDelete();
        cashFlowEntryRepository.save(entry);
        auditService.logDelete("CashFlowEntry", id);

        log.info("Запись движения денежных средств удалена: {}", id);
    }

    @Transactional(readOnly = true)
    public List<CashFlowEntryResponse> getProjectCashFlow(UUID projectId, LocalDate dateFrom, LocalDate dateTo) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);
        return cashFlowEntryRepository.findByProjectIdAndDateRange(projectId, dateFrom, dateTo)
                .stream()
                .map(CashFlowEntryResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public CashFlowSummaryResponse getCashFlowSummary(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);
        BigDecimal totalInflow = cashFlowEntryRepository.sumByProjectIdAndDirection(projectId, "in");
        BigDecimal totalOutflow = cashFlowEntryRepository.sumByProjectIdAndDirection(projectId, "out");

        BigDecimal inflow = totalInflow != null ? totalInflow : BigDecimal.ZERO;
        BigDecimal outflow = totalOutflow != null ? totalOutflow : BigDecimal.ZERO;

        // Monthly breakdown
        List<Object[]> monthlyData = cashFlowEntryRepository.getMonthlySummaryByProjectId(projectId);
        Map<String, BigDecimal[]> monthlyMap = new HashMap<>();

        for (Object[] row : monthlyData) {
            int year = ((Number) row[0]).intValue();
            int month = ((Number) row[1]).intValue();
            String direction = (String) row[2];
            BigDecimal amount = (BigDecimal) row[3];

            String key = year + "-" + month;
            monthlyMap.computeIfAbsent(key, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO});

            if ("in".equals(direction)) {
                monthlyMap.get(key)[0] = amount;
            } else {
                monthlyMap.get(key)[1] = amount;
            }
        }

        List<CashFlowSummaryResponse.MonthlyCashFlow> monthlyBreakdown = new ArrayList<>();
        monthlyMap.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .forEach(entry -> {
                    String[] parts = entry.getKey().split("-");
                    int year = Integer.parseInt(parts[0]);
                    int month = Integer.parseInt(parts[1]);
                    BigDecimal monthIn = entry.getValue()[0];
                    BigDecimal monthOut = entry.getValue()[1];
                    monthlyBreakdown.add(new CashFlowSummaryResponse.MonthlyCashFlow(
                            year, month, monthIn, monthOut, monthIn.subtract(monthOut)));
                });

        return new CashFlowSummaryResponse(inflow, outflow, inflow.subtract(outflow), monthlyBreakdown);
    }

    private CashFlowEntry getEntryOrThrow(UUID id, UUID organizationId) {
        CashFlowEntry entry = cashFlowEntryRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Запись движения денежных средств не найдена: " + id));
        validateProjectTenant(entry.getProjectId(), organizationId);
        return entry;
    }

    @Transactional
    public List<CashFlowEntryResponse> generateForecast(
            UUID projectId, LocalDate startDate, LocalDate endDate,
            int paymentDelayDays, boolean includeVat) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);

        var budgets = budgetRepository.findByProjectIdAndDeletedFalse(projectId, Pageable.unpaged()).getContent();
        if (budgets.isEmpty()) {
            throw new IllegalStateException("Нет бюджетов для проекта. Создайте бюджет перед генерацией прогноза.");
        }

        List<BudgetItem> allItems = new ArrayList<>();
        for (var budget : budgets) {
            allItems.addAll(budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budget.getId()));
        }

        if (allItems.isEmpty()) {
            throw new IllegalStateException("Нет позиций в бюджете. Импортируйте смету перед генерацией прогноза.");
        }

        BigDecimal totalCost = allItems.stream()
                .map(i -> {
                    BigDecimal cp = i.getCostPrice() != null ? i.getCostPrice() : BigDecimal.ZERO;
                    BigDecimal qty = i.getQuantity() != null ? i.getQuantity() : BigDecimal.ONE;
                    return cp.multiply(qty);
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalMaterials = allItems.stream()
                .filter(i -> i.getCategory() == com.privod.platform.modules.finance.domain.BudgetCategory.MATERIALS)
                .map(i -> i.getPlannedAmount() != null ? i.getPlannedAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalLabor = allItems.stream()
                .filter(i -> i.getCategory() == com.privod.platform.modules.finance.domain.BudgetCategory.LABOR
                        || i.getCategory() == com.privod.platform.modules.finance.domain.BudgetCategory.SUBCONTRACT)
                .map(i -> i.getPlannedAmount() != null ? i.getPlannedAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalEquipment = allItems.stream()
                .filter(i -> i.getCategory() == com.privod.platform.modules.finance.domain.BudgetCategory.EQUIPMENT)
                .map(i -> i.getPlannedAmount() != null ? i.getPlannedAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalMonths = java.time.temporal.ChronoUnit.MONTHS.between(startDate, endDate);
        if (totalMonths <= 0) totalMonths = 6;

        BigDecimal vatMultiplier = includeVat ? BigDecimal.ONE.add(VatCalculator.DEFAULT_RATE.divide(new BigDecimal("100"))) : BigDecimal.ONE;

        cashFlowEntryRepository.deleteByProjectIdAndNotes(projectId, "AUTO_FORECAST");

        List<CashFlowEntry> entries = new ArrayList<>();

        // P1-FIN-3: Build inflow forecast from contract milestones if available
        List<ContractMilestone> allMilestones = new ArrayList<>();
        List<Contract> contracts = contractRepository.findByProjectIdAndDeletedFalse(projectId);
        for (Contract contract : contracts) {
            allMilestones.addAll(contractMilestoneRepository.findByContractIdAndDeletedFalseOrderByDueDateAsc(contract.getId()));
        }

        List<ContractMilestone> forecastMilestones = allMilestones.stream()
                .filter(m -> m.getAmount() != null && m.getAmount().compareTo(BigDecimal.ZERO) > 0)
                .filter(m -> !m.getDueDate().isBefore(startDate) && !m.getDueDate().isAfter(endDate))
                .toList();

        if (!forecastMilestones.isEmpty()) {
            // Milestone-based inflow: each milestone payment date + amount
            for (ContractMilestone milestone : forecastMilestones) {
                entries.add(CashFlowEntry.builder()
                        .projectId(projectId)
                        .entryDate(milestone.getDueDate())
                        .direction("in")
                        .category(CashFlowCategory.CONTRACT_PAYMENT)
                        .amount(milestone.getAmount().multiply(vatMultiplier).setScale(2, RoundingMode.HALF_UP))
                        .description("Оплата по этапу: " + milestone.getName())
                        .notes("AUTO_FORECAST")
                        .build());
            }
            log.info("Cash flow inflow forecast for project {}: {} milestones from contracts", projectId, forecastMilestones.size());
        } else {
            // Fallback: 30% advance on start date + equal monthly payments from budget revenue
            BigDecimal totalRevenue = allItems.stream()
                    .map(i -> i.getCustomerTotal() != null ? i.getCustomerTotal() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal advancePercent = new BigDecimal("0.30");
            BigDecimal monthlyRevenue = totalRevenue.subtract(totalRevenue.multiply(advancePercent))
                    .divide(BigDecimal.valueOf(totalMonths), 2, RoundingMode.HALF_UP)
                    .multiply(vatMultiplier);

            entries.add(CashFlowEntry.builder()
                    .projectId(projectId)
                    .entryDate(startDate)
                    .direction("in")
                    .category(CashFlowCategory.CONTRACT_PAYMENT)
                    .amount(totalRevenue.multiply(advancePercent).multiply(vatMultiplier).setScale(2, RoundingMode.HALF_UP))
                    .description("Аванс по договору (30%)")
                    .notes("AUTO_FORECAST")
                    .build());

            for (long m = 1; m <= totalMonths; m++) {
                LocalDate monthDate = startDate.plusMonths(m);
                entries.add(CashFlowEntry.builder()
                        .projectId(projectId)
                        .entryDate(monthDate)
                        .direction("in")
                        .category(CashFlowCategory.CONTRACT_PAYMENT)
                        .amount(monthlyRevenue.setScale(2, RoundingMode.HALF_UP))
                        .description("Оплата по КС-2/КС-3 за " + monthDate.getMonth().getValue() + " мес.")
                        .notes("AUTO_FORECAST")
                        .build());
            }
            log.info("Cash flow inflow forecast for project {}: budget-based fallback (30% advance + equal monthly)", projectId);
        }

        // Outflow forecast: evenly distribute budget cost items across months
        BigDecimal monthlyMaterials = totalMaterials.divide(BigDecimal.valueOf(totalMonths), 2, RoundingMode.HALF_UP);
        BigDecimal monthlyLabor = totalLabor.divide(BigDecimal.valueOf(totalMonths), 2, RoundingMode.HALF_UP);
        BigDecimal monthlyEquipment = totalEquipment.divide(BigDecimal.valueOf(totalMonths), 2, RoundingMode.HALF_UP);

        for (long m = 0; m < totalMonths; m++) {
            LocalDate monthDate = startDate.plusMonths(m);

            if (monthlyMaterials.compareTo(BigDecimal.ZERO) > 0) {
                entries.add(CashFlowEntry.builder()
                        .projectId(projectId)
                        .entryDate(monthDate.plusDays(paymentDelayDays))
                        .direction("out")
                        .category(CashFlowCategory.MATERIAL_PURCHASE)
                        .amount(monthlyMaterials.setScale(2, RoundingMode.HALF_UP))
                        .description("Закупка материалов (" + (m + 1) + "/" + totalMonths + ")")
                        .notes("AUTO_FORECAST")
                        .build());
            }

            if (monthlyLabor.compareTo(BigDecimal.ZERO) > 0) {
                entries.add(CashFlowEntry.builder()
                        .projectId(projectId)
                        .entryDate(monthDate.plusDays(15))
                        .direction("out")
                        .category(CashFlowCategory.SUBCONTRACT)
                        .amount(monthlyLabor.setScale(2, RoundingMode.HALF_UP))
                        .description("Оплата работ (" + (m + 1) + "/" + totalMonths + ")")
                        .notes("AUTO_FORECAST")
                        .build());
            }

            if (monthlyEquipment.compareTo(BigDecimal.ZERO) > 0) {
                entries.add(CashFlowEntry.builder()
                        .projectId(projectId)
                        .entryDate(monthDate.plusDays(paymentDelayDays))
                        .direction("out")
                        .category(CashFlowCategory.EQUIPMENT)
                        .amount(monthlyEquipment.setScale(2, RoundingMode.HALF_UP))
                        .description("Оборудование (" + (m + 1) + "/" + totalMonths + ")")
                        .notes("AUTO_FORECAST")
                        .build());
            }
        }

        List<CashFlowEntry> saved = new ArrayList<>();
        for (CashFlowEntry entry : entries) {
            saved.add(cashFlowEntryRepository.save(entry));
        }

        log.info("Сгенерирован прогноз Cash Flow для проекта {}: {} записей, себестоимость {}",
                projectId, saved.size(), totalCost);

        return saved.stream().map(CashFlowEntryResponse::fromEntity).toList();
    }

    /**
     * P1-CHN-2: Auto-create CashFlowEntry when Invoice becomes PAID.
     * Called from InvoiceService when status transitions to PAID.
     * Idempotent: skips if an entry with this invoiceId already exists.
     */
    @Transactional
    public void createFromInvoicePaid(UUID invoiceId, UUID projectId, BigDecimal amount,
                                       String description, UUID organizationId) {
        if (projectId == null) {
            return; // Cannot create cash-flow entry without project
        }
        // Idempotency: skip if already recorded
        if (cashFlowEntryRepository.existsByInvoiceIdAndDeletedFalse(invoiceId)) {
            return;
        }
        CashFlowEntry entry = CashFlowEntry.builder()
                .projectId(projectId)
                .entryDate(java.time.LocalDate.now())
                .direction("out")
                .category(CashFlowCategory.CONTRACT_PAYMENT)
                .amount(amount != null ? amount : java.math.BigDecimal.ZERO)
                .description(description != null ? description : "Оплата счёта")
                .invoiceId(invoiceId)
                .notes("AUTO_FROM_INVOICE_PAID")
                .build();
        cashFlowEntryRepository.save(entry);
        log.info("Auto-created CashFlowEntry from invoice {} (project {})", invoiceId, projectId);
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
