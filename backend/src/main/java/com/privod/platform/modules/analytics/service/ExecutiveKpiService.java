package com.privod.platform.modules.analytics.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.analytics.web.dto.CashPositionDto;
import com.privod.platform.modules.analytics.web.dto.ExecutiveDashboardResponse;
import com.privod.platform.modules.analytics.web.dto.PortfolioSummaryDto;
import com.privod.platform.modules.analytics.web.dto.ProjectDrillDownResponse;
import com.privod.platform.modules.analytics.web.dto.ProjectHealthDto;
import com.privod.platform.modules.analytics.web.dto.ResourceUtilizationDto;
import com.privod.platform.modules.analytics.web.dto.SafetyMetricsDto;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.domain.InvoiceStatus;
import com.privod.platform.modules.finance.domain.InvoiceType;
import com.privod.platform.modules.finance.domain.Payment;
import com.privod.platform.modules.finance.domain.PaymentType;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.InvoiceRepository;
import com.privod.platform.modules.finance.repository.PaymentRepository;
import com.privod.platform.modules.fleet.domain.VehicleStatus;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.hr.domain.EmployeeStatus;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import com.privod.platform.modules.planning.domain.EvmSnapshot;
import com.privod.platform.modules.planning.domain.MultiProjectAllocation;
import com.privod.platform.modules.planning.domain.MultiProjectResourceType;
import com.privod.platform.modules.planning.repository.EvmSnapshotRepository;
import com.privod.platform.modules.planning.repository.MultiProjectAllocationRepository;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.domain.ProjectStatus;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.safety.domain.IncidentSeverity;
import com.privod.platform.modules.safety.domain.SafetyIncident;
import com.privod.platform.modules.safety.repository.SafetyIncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityNotFoundException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExecutiveKpiService {

    private final ProjectRepository projectRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetItemRepository budgetItemRepository;
    private final SafetyIncidentRepository safetyIncidentRepository;
    private final EmployeeRepository employeeRepository;
    private final VehicleRepository vehicleRepository;
    private final EvmSnapshotRepository evmSnapshotRepository;
    private final MultiProjectAllocationRepository multiProjectAllocationRepository;

    // CPI/SPI thresholds for health status
    private static final BigDecimal GREEN_THRESHOLD = new BigDecimal("0.90");
    private static final BigDecimal YELLOW_THRESHOLD = new BigDecimal("0.80");

    // ── Portfolio Summary ────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PortfolioSummaryDto getPortfolioSummary() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        List<UUID> activeProjectIds = projectRepository.findActiveProjectIdsByOrganizationId(orgId);
        long projectCount = projectRepository.countActiveProjectsByOrganizationId(orgId);

        long activeProjectCount = projectRepository
                .countByStatusAndOrganizationId(orgId)
                .stream()
                .filter(row -> row[0] == ProjectStatus.IN_PROGRESS)
                .mapToLong(row -> (Long) row[1])
                .sum();

        BigDecimal totalContractValue = safe(projectRepository.sumContractAmountByOrganizationId(orgId));
        BigDecimal totalBudget = safe(projectRepository.sumBudgetAmountByOrganizationId(orgId));

        // Batch aggregate invoiced and paid across all projects
        BigDecimal totalInvoiced = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;
        BigDecimal totalSpent = BigDecimal.ZERO;

        if (!activeProjectIds.isEmpty()) {
            // Sum issued invoices across all active projects
            Page<Invoice> issuedInvoices = invoiceRepository.findByProjectIdInAndDeletedFalse(
                    activeProjectIds, Pageable.unpaged());
            totalInvoiced = issuedInvoices.getContent().stream()
                    .filter(i -> i.getInvoiceType() == InvoiceType.ISSUED)
                    .filter(i -> i.getStatus() != InvoiceStatus.DRAFT && i.getStatus() != InvoiceStatus.CANCELLED)
                    .map(i -> safe(i.getTotalAmount()))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Sum incoming payments
            totalPaid = safe(paymentRepository.sumNetByProjectIdsAndType(activeProjectIds, PaymentType.INCOMING));

            // Total spent = actual costs from budgets
            for (UUID projectId : activeProjectIds) {
                totalSpent = totalSpent.add(safe(budgetRepository.sumActualCostByProjectId(projectId)));
            }
        }

        // EBIT margin = (totalPaid - totalSpent) / totalPaid * 100
        BigDecimal ebitMargin = BigDecimal.ZERO;
        if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
            ebitMargin = totalPaid.subtract(totalSpent)
                    .multiply(new BigDecimal("100"))
                    .divide(totalPaid, 2, RoundingMode.HALF_UP);
        }

        return new PortfolioSummaryDto(
                totalContractValue,
                totalInvoiced,
                totalPaid,
                totalBudget,
                totalSpent,
                ebitMargin,
                projectCount,
                activeProjectCount
        );
    }

    // ── Project Health Metrics ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<ProjectHealthDto> getProjectHealthMetrics() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Load all active (non-cancelled, non-deleted) projects
        Page<Project> projects = projectRepository.findByOrganizationIdAndDeletedFalse(
                orgId, Pageable.unpaged());

        List<Project> activeProjects = projects.getContent().stream()
                .filter(p -> p.getStatus() != ProjectStatus.CANCELLED)
                .toList();

        if (activeProjects.isEmpty()) {
            return List.of();
        }

        // Batch load latest EVM snapshots for all projects
        List<UUID> projectIds = activeProjects.stream().map(Project::getId).toList();
        Map<UUID, EvmSnapshot> latestEvmByProject = new HashMap<>();
        for (UUID pid : projectIds) {
            evmSnapshotRepository.findLatestByProjectId(pid)
                    .ifPresent(snap -> latestEvmByProject.put(pid, snap));
        }

        List<ProjectHealthDto> results = new ArrayList<>();
        for (Project project : activeProjects) {
            EvmSnapshot evm = latestEvmByProject.get(project.getId());

            BigDecimal cpi = BigDecimal.ONE;
            BigDecimal spi = BigDecimal.ONE;

            if (evm != null) {
                cpi = evm.getCpi() != null ? evm.getCpi() : BigDecimal.ONE;
                spi = evm.getSpi() != null ? evm.getSpi() : BigDecimal.ONE;
            }

            String healthStatus = determineHealthStatus(cpi, spi);

            BigDecimal spentAmount = safe(budgetRepository.sumActualCostByProjectId(project.getId()));

            // Forecast completion based on SPI
            LocalDate forecastCompletion = project.getPlannedEndDate();
            if (project.getPlannedStartDate() != null && project.getPlannedEndDate() != null
                    && spi.compareTo(BigDecimal.ZERO) > 0) {
                long totalDays = ChronoUnit.DAYS.between(
                        project.getPlannedStartDate(), project.getPlannedEndDate());
                long forecastDays = BigDecimal.valueOf(totalDays)
                        .divide(spi, 0, RoundingMode.CEILING)
                        .longValue();
                forecastCompletion = project.getPlannedStartDate().plusDays(forecastDays);
            }

            results.add(new ProjectHealthDto(
                    project.getId(),
                    project.getName(),
                    cpi,
                    spi,
                    healthStatus,
                    safe(project.getContractAmount()),
                    safe(project.getBudgetAmount()),
                    spentAmount,
                    project.getPlannedEndDate(),
                    forecastCompletion
            ));
        }

        return results;
    }

    // ── Cash Position ────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CashPositionDto getCashPosition() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<UUID> activeProjectIds = projectRepository.findActiveProjectIdsByOrganizationId(orgId);

        if (activeProjectIds.isEmpty()) {
            return new CashPositionDto(
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO
            );
        }

        // Load all non-draft, non-cancelled invoices for AR aging calculation
        Page<Invoice> invoicePage = invoiceRepository.findByProjectIdInAndDeletedFalse(
                activeProjectIds, Pageable.unpaged());
        List<Invoice> invoices = invoicePage.getContent();

        LocalDate today = LocalDate.now();

        BigDecimal totalAR = BigDecimal.ZERO;
        BigDecimal totalAP = BigDecimal.ZERO;
        BigDecimal arBucket0_30 = BigDecimal.ZERO;
        BigDecimal arBucket31_60 = BigDecimal.ZERO;
        BigDecimal arBucket61_90 = BigDecimal.ZERO;
        BigDecimal arBucket90Plus = BigDecimal.ZERO;

        for (Invoice inv : invoices) {
            if (inv.getStatus() == InvoiceStatus.DRAFT || inv.getStatus() == InvoiceStatus.CANCELLED
                    || inv.getStatus() == InvoiceStatus.PAID) {
                continue;
            }

            BigDecimal remaining = safe(inv.getRemainingAmount());
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                remaining = safe(inv.getTotalAmount()).subtract(safe(inv.getPaidAmount()));
            }
            if (remaining.compareTo(BigDecimal.ZERO) <= 0) {
                continue;
            }

            if (inv.getInvoiceType() == InvoiceType.ISSUED) {
                // Accounts Receivable
                totalAR = totalAR.add(remaining);

                // AR aging based on invoice date
                long daysSinceInvoice = inv.getInvoiceDate() != null
                        ? ChronoUnit.DAYS.between(inv.getInvoiceDate(), today)
                        : 0;

                if (daysSinceInvoice <= 30) {
                    arBucket0_30 = arBucket0_30.add(remaining);
                } else if (daysSinceInvoice <= 60) {
                    arBucket31_60 = arBucket31_60.add(remaining);
                } else if (daysSinceInvoice <= 90) {
                    arBucket61_90 = arBucket61_90.add(remaining);
                } else {
                    arBucket90Plus = arBucket90Plus.add(remaining);
                }
            } else if (inv.getInvoiceType() == InvoiceType.RECEIVED) {
                // Accounts Payable
                totalAP = totalAP.add(remaining);
            }
        }

        BigDecimal netCash = totalAR.subtract(totalAP);

        return new CashPositionDto(
                totalAR, totalAP, netCash,
                arBucket0_30, arBucket31_60, arBucket61_90, arBucket90Plus
        );
    }

    // ── Safety Metrics ───────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SafetyMetricsDto getSafetyMetrics() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        long totalIncidents = safetyIncidentRepository.countTotal(orgId, null);

        // Severity breakdown
        List<Object[]> severityData = safetyIncidentRepository.countBySeverity(orgId, null);
        Map<String, Long> severityBreakdown = new HashMap<>();
        for (Object[] row : severityData) {
            IncidentSeverity severity = (IncidentSeverity) row[0];
            Long count = (Long) row[1];
            severityBreakdown.put(severity.name(), count);
        }

        // TRIR calculation: (total recordable incidents * 200,000) / total hours worked
        // Using employee count * 2000 (standard annual hours) as approximation
        long employeeCount = employeeRepository.countByOrganizationIdAndDeletedFalse(orgId);
        long totalHoursWorked = employeeCount * 2000;
        BigDecimal trir = BigDecimal.ZERO;
        if (totalHoursWorked > 0) {
            trir = BigDecimal.valueOf(totalIncidents)
                    .multiply(new BigDecimal("200000"))
                    .divide(BigDecimal.valueOf(totalHoursWorked), 2, RoundingMode.HALF_UP);
        }

        // Days since last incident
        long daysSinceLastIncident = 0;
        Page<SafetyIncident> recentIncidents = safetyIncidentRepository
                .findByOrganizationIdAndDeletedFalse(orgId,
                        PageRequest.of(0, 1, Sort.by(Sort.Direction.DESC, "incidentDate")));
        if (!recentIncidents.isEmpty()) {
            SafetyIncident lastIncident = recentIncidents.getContent().get(0);
            if (lastIncident.getIncidentDate() != null) {
                daysSinceLastIncident = ChronoUnit.DAYS.between(
                        lastIncident.getIncidentDate().toLocalDate(), LocalDate.now());
                if (daysSinceLastIncident < 0) {
                    daysSinceLastIncident = 0;
                }
            }
        }

        return new SafetyMetricsDto(
                totalIncidents,
                trir,
                daysSinceLastIncident,
                severityBreakdown
        );
    }

    // ── Resource Utilization ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ResourceUtilizationDto getResourceUtilization() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        LocalDate today = LocalDate.now();

        // Total active workers
        long totalWorkers = employeeRepository.countByOrganizationIdAndDeletedFalse(orgId);

        // Workers with active allocations (allocated to a project today)
        List<MultiProjectAllocation> currentAllocations = multiProjectAllocationRepository
                .findByDateRange(orgId, today, today);

        Set<UUID> allocatedWorkerIds = currentAllocations.stream()
                .filter(a -> a.getResourceType() == MultiProjectResourceType.WORKER)
                .map(MultiProjectAllocation::getResourceId)
                .collect(Collectors.toSet());
        long allocatedWorkers = allocatedWorkerIds.size();

        BigDecimal workerUtilizationPercent = BigDecimal.ZERO;
        if (totalWorkers > 0) {
            workerUtilizationPercent = BigDecimal.valueOf(allocatedWorkers)
                    .multiply(new BigDecimal("100"))
                    .divide(BigDecimal.valueOf(totalWorkers), 2, RoundingMode.HALF_UP);
        }

        // Equipment utilization
        long totalEquipment = vehicleRepository
                .findByOrganizationIdAndDeletedFalse(orgId, Pageable.unpaged())
                .getTotalElements();

        // Count equipment with active allocation or IN_USE status
        Set<UUID> allocatedEquipmentIds = currentAllocations.stream()
                .filter(a -> a.getResourceType() == MultiProjectResourceType.EQUIPMENT)
                .map(MultiProjectAllocation::getResourceId)
                .collect(Collectors.toSet());

        // Also count vehicles that are IN_USE
        long vehiclesInUse = vehicleRepository
                .findByOrganizationIdAndStatusAndDeletedFalse(orgId, VehicleStatus.IN_USE)
                .size();

        long allocatedEquipment = Math.max(allocatedEquipmentIds.size(), vehiclesInUse);

        BigDecimal equipmentUtilizationPercent = BigDecimal.ZERO;
        if (totalEquipment > 0) {
            equipmentUtilizationPercent = BigDecimal.valueOf(allocatedEquipment)
                    .multiply(new BigDecimal("100"))
                    .divide(BigDecimal.valueOf(totalEquipment), 2, RoundingMode.HALF_UP);
        }

        return new ResourceUtilizationDto(
                totalWorkers,
                allocatedWorkers,
                workerUtilizationPercent,
                totalEquipment,
                allocatedEquipment,
                equipmentUtilizationPercent
        );
    }

    // ── Executive Dashboard (combined) ───────────────────────────────────────

    @Transactional(readOnly = true)
    public ExecutiveDashboardResponse getExecutiveDashboard() {
        return new ExecutiveDashboardResponse(
                getPortfolioSummary(),
                getProjectHealthMetrics(),
                getCashPosition(),
                getSafetyMetrics(),
                getResourceUtilization()
        );
    }

    // ── Project Drill-Down ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ProjectDrillDownResponse getProjectDrillDown(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        Project project = projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + projectId));

        // Financial aggregates for this project
        BigDecimal totalInvoiced = safe(invoiceRepository.sumTotalByProjectIdAndType(projectId, InvoiceType.ISSUED));
        BigDecimal totalPaid = safe(paymentRepository.sumTotalByProjectIdAndType(projectId, PaymentType.INCOMING));
        BigDecimal totalSpent = safe(budgetRepository.sumActualCostByProjectId(projectId));

        // EVM data
        Optional<EvmSnapshot> latestEvm = evmSnapshotRepository.findLatestByProjectId(projectId);
        BigDecimal cpi = BigDecimal.ONE;
        BigDecimal spi = BigDecimal.ONE;
        if (latestEvm.isPresent()) {
            EvmSnapshot evm = latestEvm.get();
            cpi = evm.getCpi() != null ? evm.getCpi() : BigDecimal.ONE;
            spi = evm.getSpi() != null ? evm.getSpi() : BigDecimal.ONE;
        }
        String healthStatus = determineHealthStatus(cpi, spi);

        // Budget items for this project
        List<com.privod.platform.modules.finance.domain.Budget> budgets =
                budgetRepository.findByProjectIdAndDeletedFalseOrderByCreatedAtDesc(projectId);
        List<ProjectDrillDownResponse.BudgetItemSummary> budgetItems = new ArrayList<>();
        for (var budget : budgets) {
            var items = budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budget.getId());
            for (var item : items) {
                if (item.isSection()) continue;
                budgetItems.add(new ProjectDrillDownResponse.BudgetItemSummary(
                        item.getId(),
                        item.getName(),
                        safe(item.getPlannedAmount()),
                        safe(item.getActualAmount()),
                        safe(item.getCommittedAmount()),
                        item.calculateRemainingAmount()
                ));
            }
        }

        // Recent transactions (last 20 invoices + payments)
        List<ProjectDrillDownResponse.RecentTransactionDto> recentTransactions = new ArrayList<>();

        Page<Invoice> recentInvoices = invoiceRepository.findByProjectIdAndDeletedFalse(
                projectId, PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "invoiceDate")));
        for (Invoice inv : recentInvoices.getContent()) {
            recentTransactions.add(new ProjectDrillDownResponse.RecentTransactionDto(
                    inv.getId(),
                    "INVOICE_" + inv.getInvoiceType().name(),
                    inv.getNumber(),
                    inv.getInvoiceDate(),
                    safe(inv.getTotalAmount()),
                    inv.getStatus().name()
            ));
        }

        Page<Payment> recentPayments = paymentRepository.findByProjectIdAndDeletedFalse(
                projectId, PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "paymentDate")));
        for (Payment pmt : recentPayments.getContent()) {
            recentTransactions.add(new ProjectDrillDownResponse.RecentTransactionDto(
                    pmt.getId(),
                    "PAYMENT_" + pmt.getPaymentType().name(),
                    pmt.getNumber(),
                    pmt.getPaymentDate(),
                    safe(pmt.getTotalAmount()),
                    pmt.getStatus().name()
            ));
        }

        // EVM history
        List<EvmSnapshot> evmSnapshots = evmSnapshotRepository
                .findByProjectIdAndDeletedFalseOrderBySnapshotDateDesc(projectId);
        List<ProjectDrillDownResponse.EvmDataPointDto> evmHistory = evmSnapshots.stream()
                .map(snap -> new ProjectDrillDownResponse.EvmDataPointDto(
                        snap.getSnapshotDate(),
                        safe(snap.getPlannedValue()),
                        safe(snap.getEarnedValue()),
                        safe(snap.getActualCost()),
                        snap.getCpi(),
                        snap.getSpi()
                ))
                .toList();

        return new ProjectDrillDownResponse(
                project.getId(),
                project.getName(),
                project.getCode(),
                project.getStatus().name(),
                project.getPlannedStartDate(),
                project.getPlannedEndDate(),
                project.getActualStartDate(),
                project.getActualEndDate(),
                safe(project.getContractAmount()),
                safe(project.getBudgetAmount()),
                totalInvoiced,
                totalPaid,
                totalSpent,
                cpi,
                spi,
                healthStatus,
                budgetItems,
                recentTransactions,
                evmHistory
        );
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String determineHealthStatus(BigDecimal cpi, BigDecimal spi) {
        BigDecimal minIndex = cpi.min(spi);
        if (minIndex.compareTo(GREEN_THRESHOLD) >= 0) {
            return "GREEN";
        } else if (minIndex.compareTo(YELLOW_THRESHOLD) >= 0) {
            return "YELLOW";
        } else {
            return "RED";
        }
    }

    private static BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
