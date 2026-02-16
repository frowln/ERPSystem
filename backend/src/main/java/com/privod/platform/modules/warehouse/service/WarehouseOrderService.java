package com.privod.platform.modules.warehouse.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.warehouse.domain.WarehouseOrder;
import com.privod.platform.modules.warehouse.domain.WarehouseOrderItem;
import com.privod.platform.modules.warehouse.domain.WarehouseOrderStatus;
import com.privod.platform.modules.warehouse.domain.WarehouseOrderType;
import com.privod.platform.modules.warehouse.repository.WarehouseOrderItemRepository;
import com.privod.platform.modules.warehouse.repository.WarehouseOrderRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarehouseOrderService {

    private final WarehouseOrderRepository orderRepository;
    private final WarehouseOrderItemRepository itemRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<WarehouseOrder> listOrders(WarehouseOrderStatus status, WarehouseOrderType orderType,
                                            UUID warehouseId, Pageable pageable) {
        Specification<WarehouseOrder> spec = Specification.where(notDeleted());
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (orderType != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("orderType"), orderType));
        }
        if (warehouseId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("warehouseId"), warehouseId));
        }
        return orderRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public WarehouseOrder getOrder(UUID id) {
        return getOrderOrThrow(id);
    }

    @Transactional(readOnly = true)
    public List<WarehouseOrderItem> getOrderItems(UUID orderId) {
        return itemRepository.findByWarehouseOrderIdAndDeletedFalse(orderId);
    }

    @Transactional
    public WarehouseOrder createOrder(WarehouseOrder order) {
        order.setStatus(WarehouseOrderStatus.DRAFT);
        if (order.getOrderDate() == null) {
            order.setOrderDate(LocalDate.now());
        }
        order = orderRepository.save(order);
        auditService.logCreate("WarehouseOrder", order.getId());
        log.info("Warehouse order created: {} ({}) type={}",
                order.getOrderNumber(), order.getId(), order.getOrderType());
        return order;
    }

    @Transactional
    public WarehouseOrder updateOrder(UUID id, WarehouseOrder updates) {
        WarehouseOrder order = getOrderOrThrow(id);
        if (order.getStatus() != WarehouseOrderStatus.DRAFT) {
            throw new IllegalStateException("Редактирование ордера возможно только в статусе Черновик");
        }

        if (updates.getOrderDate() != null) order.setOrderDate(updates.getOrderDate());
        if (updates.getWarehouseId() != null) order.setWarehouseId(updates.getWarehouseId());
        if (updates.getCounterpartyId() != null) order.setCounterpartyId(updates.getCounterpartyId());
        if (updates.getContractId() != null) order.setContractId(updates.getContractId());
        if (updates.getPurchaseOrderId() != null) order.setPurchaseOrderId(updates.getPurchaseOrderId());
        if (updates.getResponsibleId() != null) order.setResponsibleId(updates.getResponsibleId());
        if (updates.getReceiverId() != null) order.setReceiverId(updates.getReceiverId());
        if (updates.getNotes() != null) order.setNotes(updates.getNotes());

        order = orderRepository.save(order);
        auditService.logUpdate("WarehouseOrder", order.getId(), "multiple", null, null);
        log.info("Warehouse order updated: {} ({})", order.getOrderNumber(), order.getId());
        return order;
    }

    @Transactional
    public WarehouseOrderItem addItem(UUID orderId, WarehouseOrderItem item) {
        WarehouseOrder order = getOrderOrThrow(orderId);
        if (order.getStatus() != WarehouseOrderStatus.DRAFT) {
            throw new IllegalStateException("Добавление позиций возможно только в статусе Черновик");
        }

        item.setWarehouseOrderId(orderId);
        if (item.getUnitPrice() != null && item.getQuantity() != null) {
            item.setTotalAmount(item.getQuantity().multiply(item.getUnitPrice()).setScale(2, RoundingMode.HALF_UP));
        }
        item = itemRepository.save(item);

        recalculateOrderTotals(orderId);
        log.info("Item added to warehouse order {}: material={} qty={}",
                order.getOrderNumber(), item.getMaterialName(), item.getQuantity());
        return item;
    }

    @Transactional
    public WarehouseOrder confirmOrder(UUID id) {
        WarehouseOrder order = getOrderOrThrow(id);
        if (order.getStatus() != WarehouseOrderStatus.DRAFT) {
            throw new IllegalStateException("Провести можно только ордер в статусе Черновик");
        }

        List<WarehouseOrderItem> items = itemRepository.findByWarehouseOrderIdAndDeletedFalse(id);
        if (items.isEmpty()) {
            throw new IllegalStateException("Невозможно провести ордер без позиций");
        }

        WarehouseOrderStatus old = order.getStatus();
        order.setStatus(WarehouseOrderStatus.CONFIRMED);
        order = orderRepository.save(order);
        auditService.logStatusChange("WarehouseOrder", order.getId(), old.name(), WarehouseOrderStatus.CONFIRMED.name());
        log.info("Warehouse order confirmed: {} ({})", order.getOrderNumber(), order.getId());
        return order;
    }

    @Transactional
    public WarehouseOrder cancelOrder(UUID id) {
        WarehouseOrder order = getOrderOrThrow(id);
        if (order.getStatus() == WarehouseOrderStatus.CANCELLED) {
            throw new IllegalStateException("Ордер уже отменён");
        }

        WarehouseOrderStatus old = order.getStatus();
        order.setStatus(WarehouseOrderStatus.CANCELLED);
        order = orderRepository.save(order);
        auditService.logStatusChange("WarehouseOrder", order.getId(), old.name(), WarehouseOrderStatus.CANCELLED.name());
        log.info("Warehouse order cancelled: {} ({})", order.getOrderNumber(), order.getId());
        return order;
    }

    @Transactional
    public void deleteOrder(UUID id) {
        WarehouseOrder order = getOrderOrThrow(id);
        if (order.getStatus() != WarehouseOrderStatus.DRAFT) {
            throw new IllegalStateException("Удалить можно только ордер в статусе Черновик");
        }
        order.softDelete();
        orderRepository.save(order);
        auditService.logDelete("WarehouseOrder", id);
        log.info("Warehouse order deleted: {} ({})", order.getOrderNumber(), id);
    }

    private void recalculateOrderTotals(UUID orderId) {
        WarehouseOrder order = getOrderOrThrow(orderId);
        BigDecimal totalQty = itemRepository.sumQuantityByOrderId(orderId);
        BigDecimal totalAmt = itemRepository.sumTotalByOrderId(orderId);
        order.setTotalQuantity(totalQty);
        order.setTotalAmount(totalAmt);
        orderRepository.save(order);
    }

    private WarehouseOrder getOrderOrThrow(UUID id) {
        return orderRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Складской ордер не найден: " + id));
    }

    private static Specification<WarehouseOrder> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }
}
