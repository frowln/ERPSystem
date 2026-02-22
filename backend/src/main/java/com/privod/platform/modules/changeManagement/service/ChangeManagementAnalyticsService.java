package com.privod.platform.modules.changeManagement.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.changeManagement.domain.*;
import com.privod.platform.modules.changeManagement.repository.*;
import com.privod.platform.modules.planning.domain.WbsNode;
import com.privod.platform.modules.planning.repository.WbsNodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChangeManagementAnalyticsService {

    private final ChangeOrderRepository changeOrderRepository;
    private final ChangeOrderItemRepository changeOrderItemRepository;
    private final ChangeEventRepository changeEventRepository;
    private final WbsNodeRepository wbsNodeRepository;

    // ── Inner record types ──

    public record ScheduleImpactAnalysis(
            UUID projectId,
            int totalChangeOrders,
            int changeOrdersOnCriticalPath,
            int totalScheduleImpactDays,
            int criticalPathImpactDays,
            List<AffectedWbsNode> affectedNodes,
            List<ChangeOrderScheduleImpact> changeOrderImpacts
    ) {}

    public record AffectedWbsNode(
            UUID wbsNodeId,
            String code,
            String name,
            boolean isCriticalPath,
            int totalFloat,
            int changeOrderCount,
            BigDecimal totalCostImpact
    ) {}

    public record ChangeOrderScheduleImpact(
            UUID changeOrderId,
            String number,
            String title,
            String status,
            int scheduleImpactDays,
            boolean affectsCriticalPath,
            List<String> affectedWbsCodes
    ) {}

    public record BudgetImpactSummary(
            UUID projectId,
            BigDecimal originalContractAmount,
            BigDecimal totalApprovedAdditions,
            BigDecimal totalApprovedDeductions,
            BigDecimal netChangeAmount,
            BigDecimal revisedContractAmount,
            BigDecimal changePercentage,
            int totalChangeOrders,
            int approvedChangeOrders,
            int pendingChangeOrders,
            BigDecimal pendingAmount,
            List<BudgetImpactByType> byType,
            List<BudgetImpactMonthly> monthlyImpact
    ) {}

    public record BudgetImpactByType(
            String changeOrderType,
            int count,
            BigDecimal totalAmount,
            BigDecimal percentage
    ) {}

    public record BudgetImpactMonthly(
            String month,
            BigDecimal additions,
            BigDecimal deductions,
            BigDecimal netChange,
            BigDecimal cumulativeChange
    ) {}

    public record TrendAnalysis(
            UUID projectId,
            List<MonthlyTrend> monthlyTrends,
            List<SourceBreakdown> bySource,
            List<TypeBreakdown> byType,
            BigDecimal cumulativeCost,
            int totalEvents,
            int totalOrders
    ) {}

    public record MonthlyTrend(
            String month,
            int eventCount,
            int orderCount,
            BigDecimal orderAmount,
            BigDecimal cumulativeAmount
    ) {}

    public record SourceBreakdown(
            String source,
            int count,
            BigDecimal estimatedCost
    ) {}

    public record TypeBreakdown(
            String type,
            int count,
            BigDecimal totalAmount
    ) {}

    // ── Public methods ──

    public ScheduleImpactAnalysis getScheduleImpact(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Get all change orders for project
        List<ChangeOrder> orders = changeOrderRepository.findByProjectIdAndOrganizationIdAndDeletedFalse(projectId, orgId);

        // Get all change order items that link to WBS nodes
        List<UUID> orderIds = orders.stream().map(ChangeOrder::getId).toList();
        List<ChangeOrderItem> allItems = orderIds.isEmpty() ? List.of() :
                changeOrderItemRepository.findByChangeOrderIdInAndDeletedFalse(orderIds);

        // Get unique WBS node IDs
        Set<UUID> wbsNodeIds = allItems.stream()
                .map(ChangeOrderItem::getWbsNodeId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        // Batch-load WBS nodes
        Map<UUID, WbsNode> wbsMap = wbsNodeIds.isEmpty() ? Map.of() :
                wbsNodeRepository.findAllById(wbsNodeIds).stream()
                        .collect(Collectors.toMap(WbsNode::getId, n -> n));

        // Build affected nodes summary
        Map<UUID, List<ChangeOrderItem>> itemsByWbs = allItems.stream()
                .filter(i -> i.getWbsNodeId() != null)
                .collect(Collectors.groupingBy(ChangeOrderItem::getWbsNodeId));

        List<AffectedWbsNode> affectedNodes = itemsByWbs.entrySet().stream()
                .map(entry -> {
                    WbsNode node = wbsMap.get(entry.getKey());
                    if (node == null) return null;
                    BigDecimal totalCost = entry.getValue().stream()
                            .map(ChangeOrderItem::getTotalPrice)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new AffectedWbsNode(
                            node.getId(),
                            node.getCode(),
                            node.getName(),
                            Boolean.TRUE.equals(node.getIsCritical()),
                            node.getTotalFloat() != null ? node.getTotalFloat() : 0,
                            entry.getValue().size(),
                            totalCost
                    );
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparing(AffectedWbsNode::isCriticalPath).reversed()
                        .thenComparing(AffectedWbsNode::totalFloat))
                .toList();

        // Build per-CO schedule impact
        List<ChangeOrderScheduleImpact> coImpacts = orders.stream()
                .map(co -> {
                    List<ChangeOrderItem> coItems = allItems.stream()
                            .filter(i -> co.getId().equals(i.getChangeOrderId()))
                            .toList();
                    List<String> wbsCodes = coItems.stream()
                            .map(ChangeOrderItem::getWbsNodeId)
                            .filter(Objects::nonNull)
                            .map(wbsMap::get)
                            .filter(Objects::nonNull)
                            .map(WbsNode::getCode)
                            .distinct()
                            .toList();
                    boolean affectsCritical = coItems.stream()
                            .map(ChangeOrderItem::getWbsNodeId)
                            .filter(Objects::nonNull)
                            .map(wbsMap::get)
                            .filter(Objects::nonNull)
                            .anyMatch(n -> Boolean.TRUE.equals(n.getIsCritical()));
                    return new ChangeOrderScheduleImpact(
                            co.getId(),
                            co.getNumber(),
                            co.getTitle(),
                            co.getStatus().name(),
                            co.getScheduleImpactDays() != null ? co.getScheduleImpactDays() : 0,
                            affectsCritical,
                            wbsCodes
                    );
                })
                .toList();

        int totalImpact = orders.stream()
                .mapToInt(co -> co.getScheduleImpactDays() != null ? co.getScheduleImpactDays() : 0)
                .sum();
        int criticalImpact = coImpacts.stream()
                .filter(ChangeOrderScheduleImpact::affectsCriticalPath)
                .mapToInt(ChangeOrderScheduleImpact::scheduleImpactDays)
                .sum();

        return new ScheduleImpactAnalysis(
                projectId,
                orders.size(),
                (int) coImpacts.stream().filter(ChangeOrderScheduleImpact::affectsCriticalPath).count(),
                totalImpact,
                criticalImpact,
                affectedNodes,
                coImpacts
        );
    }

    public BudgetImpactSummary getBudgetImpact(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        List<ChangeOrder> orders = changeOrderRepository.findByProjectIdAndOrganizationIdAndDeletedFalse(projectId, orgId);

        BigDecimal originalAmount = orders.stream()
                .map(ChangeOrder::getOriginalContractAmount)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(BigDecimal.ZERO);

        // Approved/executed orders
        List<ChangeOrder> approvedOrders = orders.stream()
                .filter(co -> co.getStatus() == ChangeOrderStatus.APPROVED || co.getStatus() == ChangeOrderStatus.EXECUTED)
                .toList();

        BigDecimal additions = approvedOrders.stream()
                .filter(co -> co.getChangeOrderType() != ChangeOrderType.DEDUCTION)
                .map(ChangeOrder::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal deductions = approvedOrders.stream()
                .filter(co -> co.getChangeOrderType() == ChangeOrderType.DEDUCTION)
                .map(ChangeOrder::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal netChange = additions.subtract(deductions);
        BigDecimal revised = originalAmount.add(netChange);
        BigDecimal changePercent = originalAmount.compareTo(BigDecimal.ZERO) > 0
                ? netChange.multiply(BigDecimal.valueOf(100)).divide(originalAmount, 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Pending
        List<ChangeOrder> pendingOrders = orders.stream()
                .filter(co -> co.getStatus() == ChangeOrderStatus.DRAFT || co.getStatus() == ChangeOrderStatus.PENDING_APPROVAL)
                .toList();
        BigDecimal pendingAmount = pendingOrders.stream()
                .map(ChangeOrder::getTotalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // By type
        Map<ChangeOrderType, List<ChangeOrder>> byType = approvedOrders.stream()
                .collect(Collectors.groupingBy(ChangeOrder::getChangeOrderType));
        List<BudgetImpactByType> typeBreakdown = byType.entrySet().stream()
                .map(e -> {
                    BigDecimal total = e.getValue().stream()
                            .map(ChangeOrder::getTotalAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    BigDecimal pct = netChange.abs().compareTo(BigDecimal.ZERO) > 0
                            ? total.multiply(BigDecimal.valueOf(100)).divide(netChange.abs(), 2, RoundingMode.HALF_UP)
                            : BigDecimal.ZERO;
                    return new BudgetImpactByType(e.getKey().name(), e.getValue().size(), total, pct);
                })
                .sorted(Comparator.comparing(BudgetImpactByType::totalAmount).reversed())
                .toList();

        // Monthly impact (from createdAt)
        Map<YearMonth, List<ChangeOrder>> byMonth = approvedOrders.stream()
                .filter(co -> co.getCreatedAt() != null)
                .collect(Collectors.groupingBy(co -> YearMonth.from(co.getCreatedAt().atZone(ZoneId.systemDefault()))));

        List<YearMonth> sortedMonths = byMonth.keySet().stream().sorted().toList();
        BigDecimal cumulative = BigDecimal.ZERO;
        List<BudgetImpactMonthly> monthly = new ArrayList<>();
        for (YearMonth ym : sortedMonths) {
            List<ChangeOrder> monthOrders = byMonth.get(ym);
            BigDecimal mAdditions = monthOrders.stream()
                    .filter(co -> co.getChangeOrderType() != ChangeOrderType.DEDUCTION)
                    .map(ChangeOrder::getTotalAmount).filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal mDeductions = monthOrders.stream()
                    .filter(co -> co.getChangeOrderType() == ChangeOrderType.DEDUCTION)
                    .map(ChangeOrder::getTotalAmount).filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal mNet = mAdditions.subtract(mDeductions);
            cumulative = cumulative.add(mNet);
            monthly.add(new BudgetImpactMonthly(ym.toString(), mAdditions, mDeductions, mNet, cumulative));
        }

        return new BudgetImpactSummary(
                projectId,
                originalAmount,
                additions,
                deductions,
                netChange,
                revised,
                changePercent,
                orders.size(),
                approvedOrders.size(),
                pendingOrders.size(),
                pendingAmount,
                typeBreakdown,
                monthly
        );
    }

    public TrendAnalysis getTrends(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        List<ChangeEvent> events = changeEventRepository.findByProjectIdAndOrganizationIdAndDeletedFalse(projectId, orgId);
        List<ChangeOrder> orders = changeOrderRepository.findByProjectIdAndOrganizationIdAndDeletedFalse(projectId, orgId);

        // Monthly trends
        Map<YearMonth, List<ChangeEvent>> eventsByMonth = events.stream()
                .filter(e -> e.getCreatedAt() != null)
                .collect(Collectors.groupingBy(e -> YearMonth.from(e.getCreatedAt().atZone(ZoneId.systemDefault()))));
        Map<YearMonth, List<ChangeOrder>> ordersByMonth = orders.stream()
                .filter(co -> co.getCreatedAt() != null)
                .collect(Collectors.groupingBy(co -> YearMonth.from(co.getCreatedAt().atZone(ZoneId.systemDefault()))));

        Set<YearMonth> allMonths = new TreeSet<>();
        allMonths.addAll(eventsByMonth.keySet());
        allMonths.addAll(ordersByMonth.keySet());

        BigDecimal cumulative = BigDecimal.ZERO;
        List<MonthlyTrend> monthlyTrends = new ArrayList<>();
        for (YearMonth ym : allMonths) {
            int evtCount = eventsByMonth.getOrDefault(ym, List.of()).size();
            List<ChangeOrder> monthOrders = ordersByMonth.getOrDefault(ym, List.of());
            int ordCount = monthOrders.size();
            BigDecimal ordAmount = monthOrders.stream()
                    .map(ChangeOrder::getTotalAmount)
                    .filter(Objects::nonNull)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            cumulative = cumulative.add(ordAmount);
            monthlyTrends.add(new MonthlyTrend(ym.toString(), evtCount, ordCount, ordAmount, cumulative));
        }

        // By source
        Map<ChangeEventSource, List<ChangeEvent>> bySource = events.stream()
                .collect(Collectors.groupingBy(ChangeEvent::getSource));
        List<SourceBreakdown> sourceBreakdown = bySource.entrySet().stream()
                .map(e -> {
                    BigDecimal estCost = e.getValue().stream()
                            .map(ChangeEvent::getEstimatedCostImpact)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new SourceBreakdown(e.getKey().name(), e.getValue().size(), estCost);
                })
                .sorted(Comparator.comparingInt(SourceBreakdown::count).reversed())
                .toList();

        // By type
        Map<ChangeOrderType, List<ChangeOrder>> byOrderType = orders.stream()
                .collect(Collectors.groupingBy(ChangeOrder::getChangeOrderType));
        List<TypeBreakdown> typeBreakdown = byOrderType.entrySet().stream()
                .map(e -> {
                    BigDecimal total = e.getValue().stream()
                            .map(ChangeOrder::getTotalAmount)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new TypeBreakdown(e.getKey().name(), e.getValue().size(), total);
                })
                .sorted(Comparator.comparingInt(TypeBreakdown::count).reversed())
                .toList();

        return new TrendAnalysis(
                projectId,
                monthlyTrends,
                sourceBreakdown,
                typeBreakdown,
                cumulative,
                events.size(),
                orders.size()
        );
    }
}
