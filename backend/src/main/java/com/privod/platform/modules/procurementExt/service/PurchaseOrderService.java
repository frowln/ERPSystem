package com.privod.platform.modules.procurementExt.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.procurementExt.domain.PurchaseOrder;
import com.privod.platform.modules.procurementExt.domain.PurchaseOrderItem;
import com.privod.platform.modules.procurementExt.domain.PurchaseOrderStatus;
import com.privod.platform.modules.procurementExt.repository.PurchaseOrderItemRepository;
import com.privod.platform.modules.procurementExt.repository.PurchaseOrderRepository;
import com.privod.platform.modules.procurementExt.web.dto.PurchaseOrderBulkTransitionAction;
import com.privod.platform.modules.procurementExt.web.dto.PurchaseOrderBulkTransitionResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseOrderService {

    private final PurchaseOrderRepository orderRepository;
    private final PurchaseOrderItemRepository itemRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PurchaseOrder> listOrders(PurchaseOrderStatus status, UUID projectId,
                                           UUID supplierId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Specification<PurchaseOrder> spec = Specification.where(notDeleted())
                .and(tenantScope(organizationId));
        if (status != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("status"), status));
        }
        if (projectId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("projectId"), projectId));
        }
        if (supplierId != null) {
            spec = spec.and((root, q, cb) -> cb.equal(root.get("supplierId"), supplierId));
        }
        return orderRepository.findAll(spec, pageable);
    }

    @Transactional(readOnly = true)
    public PurchaseOrder getOrder(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return getOrderOrThrow(id, organizationId);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderItem> getOrderItems(UUID orderId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getOrderOrThrow(orderId, organizationId);
        return itemRepository.findByPurchaseOrderIdAndDeletedFalse(orderId);
    }

    @Transactional
    public PurchaseOrder createOrder(PurchaseOrder order) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        normalizeAndValidateOrder(order, organizationId);
        order = orderRepository.save(order);
        auditService.logCreate("PurchaseOrder", order.getId());
        log.info("Purchase order created: {} ({})", order.getOrderNumber(), order.getId());
        return order;
    }

    @Transactional
    public PurchaseOrder createOrderWithItems(PurchaseOrder order, List<PurchaseOrderItem> items) {
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Заказ должен содержать хотя бы одну позицию");
        }

        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        normalizeAndValidateOrder(order, organizationId);
        order = orderRepository.save(order);

        for (PurchaseOrderItem item : items) {
            item.setPurchaseOrderId(order.getId());
            normalizeAndValidateItem(item);
            recalculateItemTotal(item);
        }
        itemRepository.saveAll(items);

        recalculateOrderTotals(order.getId(), organizationId);
        PurchaseOrder created = getOrderOrThrow(order.getId(), organizationId);
        auditService.logCreate("PurchaseOrder", created.getId());
        log.info("Purchase order created with items: {} ({}) items={}",
                created.getOrderNumber(), created.getId(), items.size());
        return created;
    }

    @Transactional
    public PurchaseOrder updateOrder(UUID id, PurchaseOrder updates) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder order = getOrderOrThrow(id, organizationId);
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Редактирование заказа возможно только в статусе Черновик");
        }

        if (StringUtils.hasText(updates.getOrderNumber())) {
            String normalizedOrderNumber = updates.getOrderNumber().trim();
            if (!normalizedOrderNumber.equals(order.getOrderNumber())) {
                ensureOrderNumberIsAvailable(normalizedOrderNumber, organizationId);
                order.setOrderNumber(normalizedOrderNumber);
            }
        }
        if (updates.getProjectId() != null) order.setProjectId(updates.getProjectId());
        if (updates.getPurchaseRequestId() != null) order.setPurchaseRequestId(updates.getPurchaseRequestId());
        if (updates.getContractId() != null) order.setContractId(updates.getContractId());
        if (updates.getSupplierId() != null) order.setSupplierId(updates.getSupplierId());
        if (updates.getExpectedDeliveryDate() != null) order.setExpectedDeliveryDate(updates.getExpectedDeliveryDate());
        if (updates.getPaymentTerms() != null) order.setPaymentTerms(updates.getPaymentTerms());
        if (updates.getDeliveryAddress() != null) order.setDeliveryAddress(updates.getDeliveryAddress());
        if (updates.getNotes() != null) order.setNotes(updates.getNotes());
        if (updates.getCurrency() != null) order.setCurrency(updates.getCurrency());

        order = orderRepository.save(order);
        auditService.logUpdate("PurchaseOrder", order.getId(), "multiple", null, null);
        log.info("Purchase order updated: {} ({})", order.getOrderNumber(), order.getId());
        return order;
    }

    @Transactional
    public PurchaseOrderItem addItem(UUID orderId, PurchaseOrderItem item) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder order = getOrderOrThrow(orderId, organizationId);
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Добавление позиций возможно только в статусе Черновик");
        }

        item.setPurchaseOrderId(orderId);
        normalizeAndValidateItem(item);
        recalculateItemTotal(item);
        item = itemRepository.save(item);

        recalculateOrderTotals(orderId, organizationId);
        log.info("Item added to purchase order {}: material={} qty={}",
                order.getOrderNumber(), item.getMaterialName(), item.getQuantity());
        return item;
    }

    @Transactional
    public PurchaseOrderItem updateItem(UUID orderId, UUID itemId, PurchaseOrderItem updates) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder order = getOrderOrThrow(orderId, organizationId);
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Редактирование позиций возможно только в статусе Черновик");
        }

        PurchaseOrderItem item = getOrderItemOrThrow(orderId, itemId);
        if (updates.getMaterialId() != null) item.setMaterialId(updates.getMaterialId());
        if (updates.getMaterialName() != null) item.setMaterialName(updates.getMaterialName());
        if (updates.getUnit() != null) item.setUnit(updates.getUnit());
        if (updates.getQuantity() != null) item.setQuantity(updates.getQuantity());
        if (updates.getUnitPrice() != null) item.setUnitPrice(updates.getUnitPrice());
        if (updates.getVatRate() != null) item.setVatRate(updates.getVatRate());
        if (updates.getDeliveredQuantity() != null) item.setDeliveredQuantity(updates.getDeliveredQuantity());
        if (updates.getSpecificationItemId() != null) item.setSpecificationItemId(updates.getSpecificationItemId());

        normalizeAndValidateItem(item);
        recalculateItemTotal(item);
        item = itemRepository.save(item);
        recalculateOrderTotals(orderId, organizationId);

        auditService.logUpdate("PurchaseOrderItem", item.getId(), "multiple", null, null);
        log.info("Item updated in purchase order {}: item={} qty={}",
                order.getOrderNumber(), item.getId(), item.getQuantity());
        return item;
    }

    @Transactional
    public void deleteItem(UUID orderId, UUID itemId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder order = getOrderOrThrow(orderId, organizationId);
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Удаление позиций возможно только в статусе Черновик");
        }

        PurchaseOrderItem item = getOrderItemOrThrow(orderId, itemId);
        item.softDelete();
        itemRepository.save(item);
        recalculateOrderTotals(orderId, organizationId);

        auditService.logDelete("PurchaseOrderItem", itemId);
        log.info("Item deleted from purchase order {}: item={}", order.getOrderNumber(), itemId);
    }

    @Transactional
    public PurchaseOrder sendOrder(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder order = getOrderOrThrow(id, organizationId);
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Отправить можно только заказ в статусе Черновик");
        }

        List<PurchaseOrderItem> items = itemRepository.findByPurchaseOrderIdAndDeletedFalse(id);
        if (items.isEmpty()) {
            throw new IllegalStateException("Невозможно отправить заказ без позиций");
        }

        PurchaseOrderStatus old = order.getStatus();
        order.setStatus(PurchaseOrderStatus.SENT);
        order = orderRepository.save(order);
        auditService.logStatusChange("PurchaseOrder", order.getId(), old.name(), PurchaseOrderStatus.SENT.name());
        log.info("Purchase order sent: {} ({})", order.getOrderNumber(), order.getId());
        return order;
    }

    @Transactional
    public PurchaseOrder confirmOrder(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder order = getOrderOrThrow(id, organizationId);
        if (order.getStatus() != PurchaseOrderStatus.SENT) {
            throw new IllegalStateException("Подтвердить можно только отправленный заказ");
        }

        PurchaseOrderStatus old = order.getStatus();
        order.setStatus(PurchaseOrderStatus.CONFIRMED);
        order = orderRepository.save(order);
        auditService.logStatusChange("PurchaseOrder", order.getId(), old.name(), PurchaseOrderStatus.CONFIRMED.name());
        log.info("Purchase order confirmed: {} ({})", order.getOrderNumber(), order.getId());
        return order;
    }

    @Transactional
    public PurchaseOrder registerDelivery(UUID id, UUID itemId, BigDecimal deliveredQty) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder order = getOrderOrThrow(id, organizationId);
        if (order.getStatus() != PurchaseOrderStatus.CONFIRMED
                && order.getStatus() != PurchaseOrderStatus.PARTIALLY_DELIVERED) {
            throw new IllegalStateException("Регистрация поставки возможна только для подтверждённых заказов");
        }
        if (deliveredQty == null || deliveredQty.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Количество поставки должно быть больше нуля");
        }

        PurchaseOrderItem item = itemRepository.findById(itemId)
                .filter(i -> !i.isDeleted() && i.getPurchaseOrderId().equals(id))
                .orElseThrow(() -> new EntityNotFoundException("Позиция заказа не найдена: " + itemId));

        BigDecimal currentDelivered = item.getDeliveredQuantity() == null
                ? BigDecimal.ZERO
                : item.getDeliveredQuantity();
        BigDecimal targetDelivered = currentDelivered.add(deliveredQty).setScale(4, RoundingMode.HALF_UP);
        if (targetDelivered.compareTo(item.getQuantity()) > 0) {
            throw new IllegalStateException("Количество поставки превышает заказанное количество");
        }

        item.setDeliveredQuantity(targetDelivered);
        itemRepository.save(item);

        // Check if all items fully delivered
        List<PurchaseOrderItem> items = itemRepository.findByPurchaseOrderIdAndDeletedFalse(id);
        boolean allDelivered = items.stream().allMatch(
                i -> deliveredQuantity(i).compareTo(i.getQuantity()) >= 0);
        boolean anyDelivered = items.stream().anyMatch(
                i -> deliveredQuantity(i).compareTo(BigDecimal.ZERO) > 0);

        PurchaseOrderStatus old = order.getStatus();
        if (allDelivered) {
            order.setStatus(PurchaseOrderStatus.DELIVERED);
            order.setActualDeliveryDate(LocalDate.now());
        } else if (anyDelivered) {
            order.setStatus(PurchaseOrderStatus.PARTIALLY_DELIVERED);
        }

        order = orderRepository.save(order);
        if (old != order.getStatus()) {
            auditService.logStatusChange("PurchaseOrder", order.getId(), old.name(), order.getStatus().name());
        }
        log.info("Delivery registered for order {}: item={} qty={}",
                order.getOrderNumber(), itemId, deliveredQty);
        return order;
    }

    @Transactional
    public PurchaseOrder cancelOrder(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder order = getOrderOrThrow(id, organizationId);
        if (order.getStatus() == PurchaseOrderStatus.CLOSED
                || order.getStatus() == PurchaseOrderStatus.CANCELLED) {
            throw new IllegalStateException("Заказ уже закрыт или отменён");
        }

        PurchaseOrderStatus old = order.getStatus();
        order.setStatus(PurchaseOrderStatus.CANCELLED);
        order = orderRepository.save(order);
        auditService.logStatusChange("PurchaseOrder", order.getId(), old.name(), PurchaseOrderStatus.CANCELLED.name());
        log.info("Purchase order cancelled: {} ({})", order.getOrderNumber(), order.getId());
        return order;
    }

    @Transactional
    public PurchaseOrder closeOrder(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder order = getOrderOrThrow(id, organizationId);
        if (order.getStatus() != PurchaseOrderStatus.DELIVERED
                && order.getStatus() != PurchaseOrderStatus.INVOICED) {
            throw new IllegalStateException("Закрыть можно только полностью доставленный или оплаченный заказ");
        }

        PurchaseOrderStatus old = order.getStatus();
        order.setStatus(PurchaseOrderStatus.CLOSED);
        order = orderRepository.save(order);
        auditService.logStatusChange("PurchaseOrder", order.getId(), old.name(), PurchaseOrderStatus.CLOSED.name());
        log.info("Purchase order closed: {} ({})", order.getOrderNumber(), order.getId());
        return order;
    }

    @Transactional
    public PurchaseOrderBulkTransitionResponse bulkTransitionOrders(
            PurchaseOrderBulkTransitionAction action,
            List<UUID> orderIds
    ) {
        if (action == null) {
            throw new IllegalArgumentException("Действие для массовой операции обязательно");
        }
        if (orderIds == null || orderIds.isEmpty()) {
            throw new IllegalArgumentException("Выберите хотя бы один заказ");
        }

        List<UUID> uniqueIds = new ArrayList<>(new LinkedHashSet<>(orderIds));
        List<UUID> succeededOrderIds = new ArrayList<>();
        List<PurchaseOrderBulkTransitionResponse.ItemError> errors = new ArrayList<>();

        for (UUID orderId : uniqueIds) {
            try {
                transitionOrder(orderId, action);
                succeededOrderIds.add(orderId);
            } catch (EntityNotFoundException | IllegalStateException | IllegalArgumentException ex) {
                String errorMessage = StringUtils.hasText(ex.getMessage())
                        ? ex.getMessage()
                        : "Не удалось выполнить массовое действие";
                errors.add(new PurchaseOrderBulkTransitionResponse.ItemError(orderId, errorMessage));
                log.warn("Purchase order bulk transition failed: action={} orderId={} reason={}",
                        action, orderId, errorMessage);
            }
        }

        log.info("Purchase order bulk transition completed: action={} requested={} success={} failed={}",
                action, uniqueIds.size(), succeededOrderIds.size(), errors.size());

        return new PurchaseOrderBulkTransitionResponse(
                action,
                uniqueIds.size(),
                succeededOrderIds.size(),
                errors.size(),
                succeededOrderIds,
                errors
        );
    }

    @Transactional
    public void deleteOrder(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder order = getOrderOrThrow(id, organizationId);
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException("Удалить можно только заказ в статусе Черновик");
        }
        order.softDelete();
        orderRepository.save(order);
        auditService.logDelete("PurchaseOrder", id);
        log.info("Purchase order deleted: {} ({})", order.getOrderNumber(), id);
    }

    private void recalculateOrderTotals(UUID orderId, UUID organizationId) {
        PurchaseOrder order = getOrderOrThrow(orderId, organizationId);
        List<PurchaseOrderItem> items = itemRepository.findByPurchaseOrderIdAndDeletedFalse(orderId);

        BigDecimal subtotal = items.stream()
                .map(i -> i.getQuantity().multiply(i.getUnitPrice()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal vat = items.stream()
                .map(i -> i.getQuantity().multiply(i.getUnitPrice())
                        .multiply(vatRate(i)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        order.setSubtotal(subtotal);
        order.setVatAmount(vat);
        order.setTotalAmount(subtotal.add(vat));
        orderRepository.save(order);
    }

    private PurchaseOrder getOrderOrThrow(UUID id, UUID organizationId) {
        return orderRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Заказ поставщику не найден: " + id));
    }

    private PurchaseOrderItem getOrderItemOrThrow(UUID orderId, UUID itemId) {
        return itemRepository.findById(itemId)
                .filter(i -> !i.isDeleted() && i.getPurchaseOrderId().equals(orderId))
                .orElseThrow(() -> new EntityNotFoundException("Позиция заказа не найдена: " + itemId));
    }

    private void transitionOrder(UUID orderId, PurchaseOrderBulkTransitionAction action) {
        switch (action) {
            case SEND -> sendOrder(orderId);
            case CONFIRM -> confirmOrder(orderId);
            case CANCEL -> cancelOrder(orderId);
            case CLOSE -> closeOrder(orderId);
        }
    }

    private void normalizeAndValidateOrder(PurchaseOrder order, UUID organizationId) {
        if (!StringUtils.hasText(order.getOrderNumber())) {
            throw new IllegalArgumentException("Номер заказа обязателен");
        }
        String normalizedOrderNumber = order.getOrderNumber().trim();
        ensureOrderNumberIsAvailable(normalizedOrderNumber, organizationId);

        if (order.getSupplierId() == null) {
            throw new IllegalArgumentException("Поставщик обязателен");
        }

        order.setOrderNumber(normalizedOrderNumber);
        order.setOrganizationId(organizationId);
        order.setStatus(PurchaseOrderStatus.DRAFT);
        if (!StringUtils.hasText(order.getCurrency())) {
            order.setCurrency("RUB");
        } else {
            order.setCurrency(order.getCurrency().trim().toUpperCase());
        }
        if (order.getOrderDate() == null) {
            order.setOrderDate(LocalDate.now());
        }
    }

    private void ensureOrderNumberIsAvailable(String orderNumber, UUID organizationId) {
        boolean exists = orderRepository.findByOrderNumberAndOrganizationIdAndDeletedFalse(orderNumber, organizationId)
                .isPresent();
        if (exists) {
            throw new IllegalStateException("Заказ с таким номером уже существует в организации");
        }
    }

    private static void normalizeAndValidateItem(PurchaseOrderItem item) {
        if (item.getQuantity() == null || item.getQuantity().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Количество должно быть больше нуля");
        }
        if (item.getUnitPrice() == null || item.getUnitPrice().compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Цена за единицу должна быть больше нуля");
        }

        BigDecimal vatRate = vatRate(item);
        if (vatRate.compareTo(BigDecimal.ZERO) < 0 || vatRate.compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new IllegalArgumentException("Ставка НДС должна быть в диапазоне 0-100");
        }
        item.setVatRate(vatRate);

        BigDecimal delivered = deliveredQuantity(item);
        if (delivered.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Поставленное количество не может быть отрицательным");
        }
        if (delivered.compareTo(item.getQuantity()) > 0) {
            throw new IllegalArgumentException("Поставленное количество превышает заказанное");
        }
        item.setDeliveredQuantity(delivered);
    }

    private static void recalculateItemTotal(PurchaseOrderItem item) {
        BigDecimal total = item.getQuantity()
                .multiply(item.getUnitPrice())
                .setScale(2, RoundingMode.HALF_UP);
        item.setTotalAmount(total);
    }

    private static BigDecimal vatRate(PurchaseOrderItem item) {
        return item.getVatRate() == null ? BigDecimal.ZERO : item.getVatRate();
    }

    private static BigDecimal deliveredQuantity(PurchaseOrderItem item) {
        return item.getDeliveredQuantity() == null ? BigDecimal.ZERO : item.getDeliveredQuantity();
    }

    private static Specification<PurchaseOrder> notDeleted() {
        return (root, query, cb) -> cb.isFalse(root.get("deleted"));
    }

    private static Specification<PurchaseOrder> tenantScope(UUID organizationId) {
        return (root, query, cb) -> cb.equal(root.get("organizationId"), organizationId);
    }
}
