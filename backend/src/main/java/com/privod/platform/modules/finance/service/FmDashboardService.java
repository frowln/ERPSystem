package com.privod.platform.modules.finance.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.web.dto.FmDashboardResponse;
import com.privod.platform.modules.finance.web.dto.FmSectionSummary;
import com.privod.platform.modules.finance.web.dto.FmRiskPosition;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FmDashboardService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal RISK_THRESHOLD = new BigDecimal("1.10"); // 10% over budget

    private final BudgetService budgetService;

    @Transactional(readOnly = true)
    public FmDashboardResponse getDashboard(UUID budgetId) {
        var items = budgetService.getBudgetItemEntities(budgetId);

        BigDecimal totalCost = BigDecimal.ZERO;
        BigDecimal totalCustomer = BigDecimal.ZERO;
        BigDecimal totalContracted = BigDecimal.ZERO;
        BigDecimal totalActSigned = BigDecimal.ZERO;
        BigDecimal totalPaid = BigDecimal.ZERO;

        Map<String, BigDecimal[]> sectionTotals = new LinkedHashMap<>();
        List<FmRiskPosition> riskPositions = new ArrayList<>();

        for (BudgetItem item : items) {
            if (item.isSection() || item.isDeleted()) continue;

            BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : BigDecimal.ONE;
            BigDecimal costTotal = safe(item.getCostPrice()).multiply(qty);
            BigDecimal customerTotal = safe(item.getCustomerPrice() != null ? item.getCustomerPrice() : item.getSalePrice()).multiply(qty);
            BigDecimal contracted = safe(item.getContractedAmount());
            BigDecimal actSigned = safe(item.getActSignedAmount());
            BigDecimal paid = safe(item.getPaidAmount());

            totalCost = totalCost.add(costTotal);
            totalCustomer = totalCustomer.add(customerTotal);
            totalContracted = totalContracted.add(contracted);
            totalActSigned = totalActSigned.add(actSigned);
            totalPaid = totalPaid.add(paid);

            // Section aggregation
            String section = item.getDisciplineMark() != null ? item.getDisciplineMark() : "other";
            sectionTotals.computeIfAbsent(section, k -> new BigDecimal[]{BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO});
            BigDecimal[] arr = sectionTotals.get(section);
            arr[0] = arr[0].add(costTotal);      // planned
            arr[1] = arr[1].add(contracted);       // contracted
            arr[2] = arr[2].add(actSigned);        // actual

            // Risk detection: actual > planned * 1.1
            if (costTotal.compareTo(BigDecimal.ZERO) > 0 && actSigned.compareTo(costTotal.multiply(RISK_THRESHOLD)) > 0) {
                BigDecimal overrun = actSigned.subtract(costTotal);
                BigDecimal overrunPercent = overrun.multiply(HUNDRED).divide(costTotal, 2, RoundingMode.HALF_UP);
                riskPositions.add(new FmRiskPosition(
                        item.getId(),
                        item.getName(),
                        section,
                        costTotal.setScale(2, RoundingMode.HALF_UP),
                        actSigned.setScale(2, RoundingMode.HALF_UP),
                        overrun.setScale(2, RoundingMode.HALF_UP),
                        overrunPercent
                ));
            }
        }

        // Sort risks by overrun desc, take top 10
        riskPositions.sort((a, b) -> b.overrun().compareTo(a.overrun()));
        if (riskPositions.size() > 10) {
            riskPositions = riskPositions.subList(0, 10);
        }

        BigDecimal margin = totalCustomer.subtract(totalCost);
        BigDecimal marginPercent = totalCustomer.compareTo(BigDecimal.ZERO) != 0
                ? margin.multiply(HUNDRED).divide(totalCustomer, 4, RoundingMode.HALF_UP) : BigDecimal.ZERO;

        // Section summaries
        List<FmSectionSummary> sections = sectionTotals.entrySet().stream()
                .map(e -> new FmSectionSummary(
                        e.getKey(),
                        e.getValue()[0].setScale(2, RoundingMode.HALF_UP),
                        e.getValue()[1].setScale(2, RoundingMode.HALF_UP),
                        e.getValue()[2].setScale(2, RoundingMode.HALF_UP)
                ))
                .toList();

        return new FmDashboardResponse(
                budgetId,
                totalCost.setScale(2, RoundingMode.HALF_UP),
                totalCustomer.setScale(2, RoundingMode.HALF_UP),
                margin.setScale(2, RoundingMode.HALF_UP),
                marginPercent,
                totalContracted.setScale(2, RoundingMode.HALF_UP),
                totalActSigned.setScale(2, RoundingMode.HALF_UP),
                totalPaid.setScale(2, RoundingMode.HALF_UP),
                sections,
                riskPositions
        );
    }

    private BigDecimal safe(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }
}
