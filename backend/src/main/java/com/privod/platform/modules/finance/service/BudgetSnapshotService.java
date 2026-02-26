package com.privod.platform.modules.finance.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
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
        return createSnapshot(budgetId, name, BudgetSnapshot.SnapshotType.SNAPSHOT, null, notes);
    }

    @Transactional
    public BudgetSnapshotResponse createSnapshot(UUID budgetId,
                                                 String name,
                                                 BudgetSnapshot.SnapshotType snapshotType,
                                                 UUID sourceSnapshotId,
                                                 String notes) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        budgetRepository.findByIdAndDeletedFalse(budgetId)
                .orElseThrow(() -> new EntityNotFoundException("Бюджет не найден: " + budgetId));
        BudgetSnapshot.SnapshotType effectiveType = snapshotType != null
                ? snapshotType
                : BudgetSnapshot.SnapshotType.SNAPSHOT;
        if (effectiveType == BudgetSnapshot.SnapshotType.REFORECAST) {
            if (sourceSnapshotId == null) {
                sourceSnapshotId = snapshotRepository
                        .findFirstByBudgetIdAndSnapshotTypeAndDeletedFalseOrderBySnapshotDateDesc(
                                budgetId,
                                BudgetSnapshot.SnapshotType.BASELINE
                        )
                        .map(BudgetSnapshot::getId)
                        .orElseThrow(() -> new IllegalStateException(
                                "Для REFORECAST требуется BASELINE-снимок"));
            } else {
                UUID requestedSourceSnapshotId = sourceSnapshotId;
                BudgetSnapshot source = snapshotRepository.findByIdAndDeletedFalse(requestedSourceSnapshotId)
                        .orElseThrow(() -> new EntityNotFoundException(
                                "Снимок-источник не найден: " + requestedSourceSnapshotId));
                if (!budgetId.equals(source.getBudgetId())) {
                    throw new IllegalStateException("Снимок-источник должен относиться к тому же бюджету");
                }
                if (source.getSnapshotType() != BudgetSnapshot.SnapshotType.BASELINE) {
                    throw new IllegalStateException("REFORECAST можно строить только от BASELINE");
                }
            }
        } else {
            sourceSnapshotId = null;
        }

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
                .snapshotType(effectiveType)
                .sourceSnapshotId(sourceSnapshotId)
                .createdById(userId)
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
    public SnapshotComparisonResponse compare(UUID budgetId, UUID snapshotId, UUID targetSnapshotId) {
        BudgetSnapshot snapshot = snapshotRepository.findByIdAndDeletedFalse(snapshotId)
                .orElseThrow(() -> new EntityNotFoundException("Снимок не найден: " + snapshotId));
        if (!budgetId.equals(snapshot.getBudgetId())) {
            throw new IllegalArgumentException("Снимок не относится к указанному бюджету");
        }

        Map<UUID, SnapshotItemState> baseItems = parseSnapshotItems(snapshot.getItemsJson());
        ComparisonTarget target = targetSnapshotId == null
                ? buildCurrentTarget(snapshot.getBudgetId())
                : buildSnapshotTarget(snapshot.getBudgetId(), targetSnapshotId);

        List<ItemDelta> deltas = buildItemDeltas(baseItems, target.items());
        BigDecimal targetTotalCost = target.totalCost().setScale(2, RoundingMode.HALF_UP);
        BigDecimal targetTotalCustomer = target.totalCustomer().setScale(2, RoundingMode.HALF_UP);
        BigDecimal targetTotalMargin = target.totalMargin().setScale(2, RoundingMode.HALF_UP);

        return new SnapshotComparisonResponse(
                snapshot.getId(),
                snapshot.getSnapshotName(),
                snapshot.getSnapshotDate(),
                snapshot.getTotalCost(),
                snapshot.getTotalCustomer(),
                snapshot.getTotalMargin(),
                targetTotalCost,
                targetTotalCustomer,
                targetTotalMargin,
                targetTotalCost.subtract(snapshot.getTotalCost()).setScale(2, RoundingMode.HALF_UP),
                targetTotalCustomer.subtract(snapshot.getTotalCustomer()).setScale(2, RoundingMode.HALF_UP),
                targetTotalMargin.subtract(snapshot.getTotalMargin()).setScale(2, RoundingMode.HALF_UP),
                deltas,
                target.snapshotId(),
                target.snapshotName(),
                target.snapshotType(),
                target.snapshotDate(),
                target.comparedWithCurrent()
        );
    }

    @Transactional(readOnly = true)
    public SnapshotComparisonResponse compareWithCurrent(UUID snapshotId) {
        BudgetSnapshot snapshot = snapshotRepository.findByIdAndDeletedFalse(snapshotId)
                .orElseThrow(() -> new EntityNotFoundException("Снимок не найден: " + snapshotId));
        return compare(snapshot.getBudgetId(), snapshotId, null);
    }

    private List<ItemDelta> buildItemDeltas(Map<UUID, SnapshotItemState> baseItems,
                                            Map<UUID, SnapshotItemState> targetItems) {
        List<ItemDelta> deltas = new ArrayList<>();
        for (SnapshotItemState base : baseItems.values()) {
            SnapshotItemState target = targetItems.get(base.itemId());
            if (target == null) {
                deltas.add(new ItemDelta(
                        base.itemId(), base.name(),
                        base.costPrice(), null, negateOrNull(base.costPrice()),
                        base.customerPrice(), null, negateOrNull(base.customerPrice()),
                        base.quantity(), null, negateOrNull(base.quantity()),
                        base.marginAmount(), null, negateOrNull(base.marginAmount()),
                        "REMOVED"
                ));
                continue;
            }

            boolean changed = !eq(base.costPrice(), target.costPrice())
                    || !eq(base.customerPrice(), target.customerPrice())
                    || !eq(base.quantity(), target.quantity())
                    || !eq(base.marginAmount(), target.marginAmount());
            if (changed) {
                deltas.add(new ItemDelta(
                        base.itemId(), target.name(),
                        base.costPrice(), target.costPrice(), subtract(target.costPrice(), base.costPrice()),
                        base.customerPrice(), target.customerPrice(), subtract(target.customerPrice(), base.customerPrice()),
                        base.quantity(), target.quantity(), subtract(target.quantity(), base.quantity()),
                        base.marginAmount(), target.marginAmount(), subtract(target.marginAmount(), base.marginAmount()),
                        "CHANGED"
                ));
            }
        }

        for (SnapshotItemState target : targetItems.values()) {
            if (!baseItems.containsKey(target.itemId())) {
                deltas.add(new ItemDelta(
                        target.itemId(), target.name(),
                        null, target.costPrice(), target.costPrice(),
                        null, target.customerPrice(), target.customerPrice(),
                        null, target.quantity(), target.quantity(),
                        null, target.marginAmount(), target.marginAmount(),
                        "ADDED"
                ));
            }
        }
        return deltas;
    }

    private ComparisonTarget buildCurrentTarget(UUID budgetId) {
        List<BudgetItem> currentItems = budgetItemRepository.findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budgetId);
        Map<UUID, SnapshotItemState> itemMap = new HashMap<>();
        BigDecimal totalCost = ZERO;
        BigDecimal totalCustomer = ZERO;
        for (BudgetItem item : currentItems) {
            if (item.isSection()) {
                continue;
            }
            BigDecimal qty = item.getQuantity() != null ? item.getQuantity() : ONE;
            BigDecimal costTotal = (item.getCostPrice() != null ? item.getCostPrice() : ZERO).multiply(qty);
            BigDecimal customerTotal = (item.getCustomerPrice() != null ? item.getCustomerPrice() : ZERO).multiply(qty);
            totalCost = totalCost.add(costTotal);
            totalCustomer = totalCustomer.add(customerTotal);
            itemMap.put(item.getId(), new SnapshotItemState(
                    item.getId(),
                    item.getName(),
                    item.getCostPrice(),
                    item.getCustomerPrice(),
                    item.getQuantity(),
                    item.getMarginAmount()
            ));
        }
        return new ComparisonTarget(
                null,
                "CURRENT",
                null,
                Instant.now(),
                totalCost,
                totalCustomer,
                totalCustomer.subtract(totalCost),
                itemMap,
                true
        );
    }

    private ComparisonTarget buildSnapshotTarget(UUID budgetId, UUID targetSnapshotId) {
        BudgetSnapshot target = snapshotRepository.findByIdAndDeletedFalse(targetSnapshotId)
                .orElseThrow(() -> new EntityNotFoundException("Снимок не найден: " + targetSnapshotId));
        if (!budgetId.equals(target.getBudgetId())) {
            throw new IllegalArgumentException("Снимок сравнения относится к другому бюджету");
        }
        return new ComparisonTarget(
                target.getId(),
                target.getSnapshotName(),
                target.getSnapshotType(),
                target.getSnapshotDate(),
                target.getTotalCost(),
                target.getTotalCustomer(),
                target.getTotalMargin(),
                parseSnapshotItems(target.getItemsJson()),
                false
        );
    }

    private Map<UUID, SnapshotItemState> parseSnapshotItems(String itemsJson) {
        List<Map<String, Object>> snapshotItems;
        try {
            snapshotItems = objectMapper.readValue(itemsJson, new TypeReference<List<Map<String, Object>>>() {
            });
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Не удалось десериализовать данные снимка", e);
        }
        Map<UUID, SnapshotItemState> result = new HashMap<>();
        for (Map<String, Object> snapItem : snapshotItems) {
            Boolean isSection = (Boolean) snapItem.get("section");
            if (Boolean.TRUE.equals(isSection)) {
                continue;
            }
            UUID itemId = UUID.fromString(String.valueOf(snapItem.get("id")));
            result.put(itemId, new SnapshotItemState(
                    itemId,
                    (String) snapItem.get("name"),
                    toBigDecimal(snapItem.get("costPrice")),
                    toBigDecimal(snapItem.get("customerPrice")),
                    toBigDecimal(snapItem.get("quantity")),
                    toBigDecimal(snapItem.get("marginAmount"))
            ));
        }
        return result;
    }

    private record SnapshotItemState(
            UUID itemId,
            String name,
            BigDecimal costPrice,
            BigDecimal customerPrice,
            BigDecimal quantity,
            BigDecimal marginAmount
    ) {
    }

    private record ComparisonTarget(
            UUID snapshotId,
            String snapshotName,
            BudgetSnapshot.SnapshotType snapshotType,
            Instant snapshotDate,
            BigDecimal totalCost,
            BigDecimal totalCustomer,
            BigDecimal totalMargin,
            Map<UUID, SnapshotItemState> items,
            boolean comparedWithCurrent
    ) {
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
