package com.privod.platform.modules.finance.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.finance.domain.Budget;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.BudgetSnapshot;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.finance.repository.BudgetRepository;
import com.privod.platform.modules.finance.repository.BudgetSnapshotRepository;
import com.privod.platform.modules.finance.web.dto.BudgetSnapshotResponse;
import com.privod.platform.modules.finance.web.dto.SnapshotComparisonResponse;
import com.privod.platform.modules.finance.web.dto.SnapshotComparisonResponse.ItemDelta;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BudgetSnapshotService {

    private final BudgetSnapshotRepository snapshotRepository;
    private final BudgetRepository budgetRepository;
    private final BudgetItemRepository budgetItemRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    private static final BigDecimal ZERO = BigDecimal.ZERO;
    private static final BigDecimal ONE = BigDecimal.ONE;
    private static final BigDecimal HUNDRED = new BigDecimal("100");

    @Transactional
    public BudgetSnapshotResponse createSnapshot(UUID budgetId, String name, String notes) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        Budget budget = budgetRepository.findByIdAndDeletedFalse(budgetId)
                .orElseThrow(() -> new EntityNotFoundException("Бюджет не найден: " + budgetId));

        List<BudgetItem> items = budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budgetId);

        BigDecimal totalCost = ZERO;
        BigDecimal totalCustomer = ZERO;

        List<Map<String, Object>> itemSnapshots = new ArrayList<>();
        for (BudgetItem item : items) {
            if (item.isSection()) continue;

            BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : ONE;
            BigDecimal costTotal = (item.getCostPrice() != null ? item.getCostPrice() : ZERO).multiply(qty);
            BigDecimal custTotal = (item.getCustomerPrice() != null ? item.getCustomerPrice() : ZERO).multiply(qty);

            totalCost = totalCost.add(costTotal);
            totalCustomer = totalCustomer.add(custTotal);

            Map<String, Object> snap = new HashMap<>();
            snap.put("id", item.getId().toString());
            snap.put("name", item.getName());
            snap.put("costPrice", item.getCostPrice());
            snap.put("customerPrice", item.getCustomerPrice());
            snap.put("quantity", item.getQuantity());
            snap.put("marginAmount", item.getMarginAmount());
            snap.put("marginPercent", item.getMarginPercent());
            snap.put("section", item.isSection());
            snap.put("parentId", item.getParentId() != null ? item.getParentId().toString() : null);
            snap.put("itemType", item.getItemType() != null ? item.getItemType().name() : null);
            snap.put("unit", item.getUnit());
            snap.put("disciplineMark", item.getDisciplineMark());
            itemSnapshots.add(snap);
        }

        BigDecimal totalMargin = totalCustomer.subtract(totalCost);
        BigDecimal marginPercent = totalCustomer.compareTo(ZERO) != 0
                ? totalMargin.multiply(HUNDRED).divide(totalCustomer, 4, RoundingMode.HALF_UP)
                : ZERO;

        String itemsJson;
        try {
            itemsJson = objectMapper.writeValueAsString(itemSnapshots);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Не удалось сериализовать данные снимка", e);
        }

        BudgetSnapshot snapshot = BudgetSnapshot.builder()
                .budgetId(budgetId)
                .organizationId(organizationId)
                .snapshotName(name)
                .snapshotDate(Instant.now())
                .totalCost(totalCost.setScale(2, RoundingMode.HALF_UP))
                .totalCustomer(totalCustomer.setScale(2, RoundingMode.HALF_UP))
                .totalMargin(totalMargin.setScale(2, RoundingMode.HALF_UP))
                .marginPercent(marginPercent)
                .itemsJson(itemsJson)
                .notes(notes)
                .build();

        snapshot = snapshotRepository.save(snapshot);
        auditService.logCreate("BudgetSnapshot", snapshot.getId());

        log.info("Снимок ФМ создан: '{}' для бюджета {}", name, budgetId);
        return BudgetSnapshotResponse.fromEntity(snapshot);
    }

    @Transactional(readOnly = true)
    public Page<BudgetSnapshotResponse> listSnapshots(UUID budgetId, Pageable pageable) {
        return snapshotRepository.findByBudgetIdAndDeletedFalseOrderBySnapshotDateDesc(budgetId, pageable)
                .map(BudgetSnapshotResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SnapshotComparisonResponse compareWithCurrent(UUID snapshotId) {
        BudgetSnapshot snapshot = snapshotRepository.findByIdAndDeletedFalse(snapshotId)
                .orElseThrow(() -> new EntityNotFoundException("Снимок не найден: " + snapshotId));

        List<BudgetItem> currentItems = budgetItemRepository
                .findByBudgetIdAndDeletedFalseOrderBySequenceAsc(snapshot.getBudgetId());

        Map<UUID, BudgetItem> currentMap = new HashMap<>();
        BigDecimal currentTotalCost = ZERO;
        BigDecimal currentTotalCustomer = ZERO;

        for (BudgetItem item : currentItems) {
            if (item.isSection()) continue;
            currentMap.put(item.getId(), item);
            BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : ONE;
            currentTotalCost = currentTotalCost.add(
                    (item.getCostPrice() != null ? item.getCostPrice() : ZERO).multiply(qty));
            currentTotalCustomer = currentTotalCustomer.add(
                    (item.getCustomerPrice() != null ? item.getCustomerPrice() : ZERO).multiply(qty));
        }
        BigDecimal currentTotalMargin = currentTotalCustomer.subtract(currentTotalCost);

        List<Map<String, Object>> snapshotItems;
        try {
            snapshotItems = objectMapper.readValue(snapshot.getItemsJson(),
                    new TypeReference<List<Map<String, Object>>>() {});
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Не удалось десериализовать данные снимка", e);
        }

        List<ItemDelta> deltas = new ArrayList<>();
        Map<UUID, Boolean> processedIds = new HashMap<>();

        for (Map<String, Object> snapItem : snapshotItems) {
            Boolean isSection = (Boolean) snapItem.get("section");
            if (Boolean.TRUE.equals(isSection)) continue;

            UUID itemId = UUID.fromString((String) snapItem.get("id"));
            processedIds.put(itemId, true);

            BigDecimal snapCost = toBigDecimal(snapItem.get("costPrice"));
            BigDecimal snapCust = toBigDecimal(snapItem.get("customerPrice"));
            BigDecimal snapQty = toBigDecimal(snapItem.get("quantity"));
            BigDecimal snapMargin = toBigDecimal(snapItem.get("marginAmount"));

            BudgetItem current = currentMap.get(itemId);
            if (current == null) {
                deltas.add(new ItemDelta(
                        itemId, (String) snapItem.get("name"),
                        snapCost, null, negateOrNull(snapCost),
                        snapCust, null, negateOrNull(snapCust),
                        snapQty, null, negateOrNull(snapQty),
                        snapMargin, null, negateOrNull(snapMargin),
                        "REMOVED"
                ));
            } else {
                BigDecimal curCost = current.getCostPrice();
                BigDecimal curCust = current.getCustomerPrice();
                BigDecimal curQty = current.getQuantity();
                BigDecimal curMargin = current.getMarginAmount();

                boolean changed = !eq(snapCost, curCost) || !eq(snapCust, curCust)
                        || !eq(snapQty, curQty) || !eq(snapMargin, curMargin);

                if (changed) {
                    deltas.add(new ItemDelta(
                            itemId, current.getName(),
                            snapCost, curCost, subtract(curCost, snapCost),
                            snapCust, curCust, subtract(curCust, snapCust),
                            snapQty, curQty, subtract(curQty, snapQty),
                            snapMargin, curMargin, subtract(curMargin, snapMargin),
                            "CHANGED"
                    ));
                }
            }
        }

        for (BudgetItem item : currentItems) {
            if (item.isSection()) continue;
            if (!processedIds.containsKey(item.getId())) {
                deltas.add(new ItemDelta(
                        item.getId(), item.getName(),
                        null, item.getCostPrice(), item.getCostPrice(),
                        null, item.getCustomerPrice(), item.getCustomerPrice(),
                        null, item.getQuantity(), item.getQuantity(),
                        null, item.getMarginAmount(), item.getMarginAmount(),
                        "ADDED"
                ));
            }
        }

        return new SnapshotComparisonResponse(
                snapshot.getId(),
                snapshot.getSnapshotName(),
                snapshot.getSnapshotDate(),
                snapshot.getTotalCost(),
                snapshot.getTotalCustomer(),
                snapshot.getTotalMargin(),
                currentTotalCost.setScale(2, RoundingMode.HALF_UP),
                currentTotalCustomer.setScale(2, RoundingMode.HALF_UP),
                currentTotalMargin.setScale(2, RoundingMode.HALF_UP),
                currentTotalCost.subtract(snapshot.getTotalCost()).setScale(2, RoundingMode.HALF_UP),
                currentTotalCustomer.subtract(snapshot.getTotalCustomer()).setScale(2, RoundingMode.HALF_UP),
                currentTotalMargin.subtract(snapshot.getTotalMargin()).setScale(2, RoundingMode.HALF_UP),
                deltas
        );
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value == null) return null;
        if (value instanceof BigDecimal bd) return bd;
        if (value instanceof Number n) return BigDecimal.valueOf(n.doubleValue());
        try {
            return new BigDecimal(value.toString());
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private boolean eq(BigDecimal a, BigDecimal b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.compareTo(b) == 0;
    }

    private BigDecimal subtract(BigDecimal a, BigDecimal b) {
        BigDecimal va = a != null ? a : ZERO;
        BigDecimal vb = b != null ? b : ZERO;
        return va.subtract(vb);
    }

    private BigDecimal negateOrNull(BigDecimal val) {
        return val != null ? val.negate() : null;
    }
}
