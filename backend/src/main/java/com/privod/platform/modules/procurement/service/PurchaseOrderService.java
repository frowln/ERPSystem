package com.privod.platform.modules.procurement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.procurement.domain.PurchaseOrder;
import com.privod.platform.modules.procurement.domain.PurchaseOrderItem;
import com.privod.platform.modules.procurement.domain.PurchaseOrderStatus;
import com.privod.platform.modules.procurement.domain.PurchaseRequest;
import com.privod.platform.modules.procurement.domain.PurchaseRequestItem;
import com.privod.platform.modules.procurement.domain.PurchaseRequestStatus;
import com.privod.platform.modules.procurement.repository.PurchaseOrderItemRepository;
import com.privod.platform.modules.procurement.repository.PurchaseOrderRepository;
import com.privod.platform.modules.procurement.repository.PurchaseRequestItemRepository;
import com.privod.platform.modules.procurement.repository.PurchaseRequestRepository;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseOrderItemRequest;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseOrderRequest;
import com.privod.platform.modules.procurement.web.dto.DeliveryItemRequest;
import com.privod.platform.modules.procurement.web.dto.PurchaseOrderItemResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseOrderResponse;
import com.privod.platform.modules.procurement.web.dto.RecordDeliveryRequest;
import com.privod.platform.modules.procurement.web.dto.UpdatePurchaseOrderRequest;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service("procurementPurchaseOrderService")
@RequiredArgsConstructor
@Slf4j
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final PurchaseOrderItemRepository purchaseOrderItemRepository;
    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseRequestItemRepository purchaseRequestItemRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    @Transactional
    public PurchaseOrderResponse createFromPurchaseRequest(UUID purchaseRequestId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseRequest pr = purchaseRequestRepository.findByIdAndOrganizationIdAndDeletedFalse(purchaseRequestId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Заявка на закупку не найдена: " + purchaseRequestId));

        if (pr.getStatus() != PurchaseRequestStatus.APPROVED && pr.getStatus() != PurchaseRequestStatus.ASSIGNED) {
            throw new IllegalStateException(
                    String.format("Создание заказа возможно только из согласованной или назначенной заявки. Текущий статус: %s",
                            pr.getStatus().getDisplayName()));
        }

        // Check if PO already exists for this PR
        purchaseOrderRepository.findByPurchaseRequestIdAndOrganizationIdAndDeletedFalse(purchaseRequestId, organizationId)
                .ifPresent(existing -> {
                    throw new IllegalStateException(
                            String.format("Заказ по заявке %s уже существует: %s", pr.getName(), existing.getOrderNumber()));
                });

        String orderNumber = generateOrderNumber(organizationId);

        PurchaseOrder po = PurchaseOrder.builder()
                .organizationId(organizationId)
                .orderNumber(orderNumber)
                .projectId(pr.getProjectId())
                .purchaseRequestId(purchaseRequestId)
                .contractId(pr.getContractId())
                .supplierId(pr.getAssignedToId() != null ? pr.getAssignedToId() : UUID.randomUUID()) // placeholder supplier
                .orderDate(LocalDate.now())
                .status(PurchaseOrderStatus.DRAFT)
                .build();

        po = purchaseOrderRepository.save(po);

        // Copy items from purchase request
        List<PurchaseRequestItem> prItems = purchaseRequestItemRepository
                .findByRequestIdAndDeletedFalseOrderBySequenceAsc(purchaseRequestId);

        List<PurchaseOrderItem> poItems = new ArrayList<>();
        for (PurchaseRequestItem prItem : prItems) {
            PurchaseOrderItem poItem = PurchaseOrderItem.builder()
                    .purchaseOrderId(po.getId())
                    .materialId(prItem.getSpecItemId() != null ? prItem.getSpecItemId() : UUID.randomUUID())
                    .materialName(prItem.getName())
                    .unit(prItem.getUnitOfMeasure())
                    .quantity(prItem.getQuantity())
                    .unitPrice(prItem.getUnitPrice() != null ? prItem.getUnitPrice() : BigDecimal.ZERO)
                    .specificationItemId(prItem.getSpecItemId())
                    .build();
            poItem.computeTotalAmount();
            poItems.add(purchaseOrderItemRepository.save(poItem));
        }

        // Recalculate totals
        recalculateTotals(po.getId());
        po = getOrderOrThrow(po.getId(), organizationId);

        // Update PR status to ORDERED and set back-reference
        if (pr.canTransitionTo(PurchaseRequestStatus.ORDERED)) {
            PurchaseRequestStatus oldStatus = pr.getStatus();
            pr.setStatus(PurchaseRequestStatus.ORDERED);
            purchaseRequestRepository.save(pr);
            auditService.logStatusChange("PurchaseRequest", pr.getId(), oldStatus.name(), PurchaseRequestStatus.ORDERED.name());
        }

        auditService.logCreate("PurchaseOrder", po.getId());
        log.info("Заказ поставщику создан из заявки: {} ({}) -> {} ({})",
                pr.getName(), pr.getId(), po.getOrderNumber(), po.getId());

        return buildResponse(po, poItems);
    }

    @Transactional
    public PurchaseOrderResponse create(CreatePurchaseOrderRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(request.projectId(), organizationId);

        String orderNumber = generateOrderNumber(organizationId);

        PurchaseOrder po = PurchaseOrder.builder()
                .organizationId(organizationId)
                .orderNumber(orderNumber)
                .projectId(request.projectId())
                .purchaseRequestId(request.purchaseRequestId())
                .contractId(request.contractId())
                .supplierId(request.supplierId())
                .orderDate(request.orderDate())
                .expectedDeliveryDate(request.expectedDeliveryDate())
                .paymentTerms(request.paymentTerms())
                .deliveryAddress(request.deliveryAddress())
                .notes(request.notes())
                .status(PurchaseOrderStatus.DRAFT)
                .build();

        po = purchaseOrderRepository.save(po);

        List<PurchaseOrderItem> poItems = new ArrayList<>();
        if (request.items() != null) {
            for (CreatePurchaseOrderItemRequest itemReq : request.items()) {
                PurchaseOrderItem item = PurchaseOrderItem.builder()
                        .purchaseOrderId(po.getId())
                        .materialId(itemReq.materialId() != null ? itemReq.materialId() : UUID.randomUUID())
                        .materialName(itemReq.materialName())
                        .unit(itemReq.unit())
                        .quantity(itemReq.quantity())
                        .unitPrice(itemReq.unitPrice())
                        .vatRate(itemReq.vatRate() != null ? itemReq.vatRate() : new BigDecimal("20.00"))
                        .specificationItemId(itemReq.specificationItemId())
                        .build();
                item.computeTotalAmount();
                poItems.add(purchaseOrderItemRepository.save(item));
            }
        }

        recalculateTotals(po.getId());
        po = getOrderOrThrow(po.getId(), organizationId);

        auditService.logCreate("PurchaseOrder", po.getId());
        log.info("Заказ поставщику создан: {} ({})", po.getOrderNumber(), po.getId());

        return buildResponse(po, poItems);
    }

    @Transactional
    public PurchaseOrderResponse update(UUID poId, UpdatePurchaseOrderRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder po = getOrderOrThrow(poId, organizationId);
        validateDraftStatus(po.getStatus());

        if (request.supplierId() != null) {
            po.setSupplierId(request.supplierId());
        }
        if (request.projectId() != null) {
            validateProjectTenant(request.projectId(), organizationId);
            po.setProjectId(request.projectId());
        }
        if (request.contractId() != null) {
            po.setContractId(request.contractId());
        }
        if (request.orderDate() != null) {
            po.setOrderDate(request.orderDate());
        }
        if (request.expectedDeliveryDate() != null) {
            po.setExpectedDeliveryDate(request.expectedDeliveryDate());
        }
        if (request.paymentTerms() != null) {
            po.setPaymentTerms(request.paymentTerms());
        }
        if (request.deliveryAddress() != null) {
            po.setDeliveryAddress(request.deliveryAddress());
        }
        if (request.notes() != null) {
            po.setNotes(request.notes());
        }

        po = purchaseOrderRepository.save(po);
        auditService.logUpdate("PurchaseOrder", po.getId(), "multiple", null, null);

        log.info("Заказ поставщику обновлён: {} ({})", po.getOrderNumber(), po.getId());
        return buildFullResponse(po);
    }

    @Transactional
    public PurchaseOrderResponse approve(UUID poId) {
        return transitionStatus(poId, PurchaseOrderStatus.APPROVED, "согласован");
    }

    @Transactional
    public PurchaseOrderResponse markSent(UUID poId) {
        return transitionStatus(poId, PurchaseOrderStatus.SENT_TO_SUPPLIER, "отправлен поставщику");
    }

    @Transactional
    public PurchaseOrderResponse recordDelivery(UUID poId, RecordDeliveryRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder po = getOrderOrThrow(poId, organizationId);

        if (po.getStatus() != PurchaseOrderStatus.SENT_TO_SUPPLIER
                && po.getStatus() != PurchaseOrderStatus.PARTIALLY_DELIVERED) {
            throw new IllegalStateException(
                    String.format("Приёмка доставки возможна только из статуса «Отправлен поставщику» или «Частично доставлен». Текущий статус: %s",
                            po.getStatus().getDisplayName()));
        }

        for (DeliveryItemRequest deliveryItem : request.items()) {
            PurchaseOrderItem item = purchaseOrderItemRepository.findById(deliveryItem.itemId())
                    .filter(i -> !i.isDeleted() && i.getPurchaseOrderId().equals(poId))
                    .orElseThrow(() -> new EntityNotFoundException("Позиция заказа не найдена: " + deliveryItem.itemId()));

            BigDecimal newDelivered = item.getDeliveredQuantity().add(deliveryItem.deliveredQuantity());
            item.setDeliveredQuantity(newDelivered);
            purchaseOrderItemRepository.save(item);
        }

        // Determine if fully or partially delivered
        List<PurchaseOrderItem> allItems = purchaseOrderItemRepository
                .findByPurchaseOrderIdAndDeletedFalseOrderByCreatedAtAsc(poId);

        boolean allDelivered = allItems.stream().allMatch(item ->
                item.getDeliveredQuantity().compareTo(item.getQuantity()) >= 0);

        PurchaseOrderStatus oldStatus = po.getStatus();
        PurchaseOrderStatus newStatus = allDelivered
                ? PurchaseOrderStatus.DELIVERED
                : PurchaseOrderStatus.PARTIALLY_DELIVERED;

        po.setStatus(newStatus);
        if (request.deliveryDate() != null) {
            po.setActualDeliveryDate(request.deliveryDate());
        } else if (allDelivered) {
            po.setActualDeliveryDate(LocalDate.now());
        }

        po = purchaseOrderRepository.save(po);
        auditService.logStatusChange("PurchaseOrder", po.getId(), oldStatus.name(), newStatus.name());

        log.info("Доставка заказа зафиксирована: {} ({}) -> {}", po.getOrderNumber(), po.getId(), newStatus.getDisplayName());

        // If fully delivered, update linked PurchaseRequest
        if (allDelivered && po.getPurchaseRequestId() != null) {
            purchaseRequestRepository.findByIdAndOrganizationIdAndDeletedFalse(po.getPurchaseRequestId(), organizationId)
                    .ifPresent(pr -> {
                        if (pr.canTransitionTo(PurchaseRequestStatus.DELIVERED)) {
                            PurchaseRequestStatus prOld = pr.getStatus();
                            pr.setStatus(PurchaseRequestStatus.DELIVERED);
                            purchaseRequestRepository.save(pr);
                            auditService.logStatusChange("PurchaseRequest", pr.getId(), prOld.name(), PurchaseRequestStatus.DELIVERED.name());
                        }
                    });
        }

        return buildResponse(po, allItems);
    }

    @Transactional
    public PurchaseOrderResponse cancel(UUID poId) {
        return transitionStatus(poId, PurchaseOrderStatus.CANCELLED, "отменён");
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getById(UUID poId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder po = getOrderOrThrow(poId, organizationId);
        return buildFullResponse(po);
    }

    @Transactional(readOnly = true)
    public List<PurchaseOrderResponse> getByProject(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);

        List<PurchaseOrder> orders = purchaseOrderRepository
                .findByProjectIdAndOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(projectId, organizationId);

        return orders.stream()
                .map(this::buildFullResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public PurchaseOrderResponse getByPurchaseRequest(UUID purchaseRequestId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder po = purchaseOrderRepository
                .findByPurchaseRequestIdAndOrganizationIdAndDeletedFalse(purchaseRequestId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Заказ по заявке не найден: " + purchaseRequestId));
        return buildFullResponse(po);
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private PurchaseOrderResponse transitionStatus(UUID poId, PurchaseOrderStatus targetStatus, String actionLabel) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder po = getOrderOrThrow(poId, organizationId);
        PurchaseOrderStatus oldStatus = po.getStatus();

        if (!po.canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести заказ из статуса %s в %s",
                            oldStatus.getDisplayName(), targetStatus.getDisplayName()));
        }

        po.setStatus(targetStatus);
        po = purchaseOrderRepository.save(po);
        auditService.logStatusChange("PurchaseOrder", po.getId(), oldStatus.name(), targetStatus.name());

        log.info("Заказ поставщику {}: {} ({})", actionLabel, po.getOrderNumber(), po.getId());
        return buildFullResponse(po);
    }

    private PurchaseOrder getOrderOrThrow(UUID poId, UUID organizationId) {
        return purchaseOrderRepository.findByIdAndOrganizationIdAndDeletedFalse(poId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Заказ поставщику не найден: " + poId));
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) {
            return;
        }
        projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
    }

    private void validateDraftStatus(PurchaseOrderStatus status) {
        if (status != PurchaseOrderStatus.DRAFT) {
            throw new IllegalStateException(
                    String.format("Редактирование заказа возможно только в статусе Черновик. Текущий статус: %s",
                            status.getDisplayName()));
        }
    }

    private void recalculateTotals(UUID orderId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseOrder po = getOrderOrThrow(orderId, organizationId);

        List<PurchaseOrderItem> items = purchaseOrderItemRepository
                .findByPurchaseOrderIdAndDeletedFalseOrderByCreatedAtAsc(orderId);

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal vatTotal = BigDecimal.ZERO;

        for (PurchaseOrderItem item : items) {
            BigDecimal itemTotal = item.getTotalAmount() != null ? item.getTotalAmount() : BigDecimal.ZERO;
            subtotal = subtotal.add(itemTotal);

            BigDecimal vatRate = item.getVatRate() != null ? item.getVatRate() : new BigDecimal("20.00");
            BigDecimal itemVat = itemTotal.multiply(vatRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            vatTotal = vatTotal.add(itemVat);
        }

        po.setSubtotal(subtotal);
        po.setVatAmount(vatTotal);
        po.setTotalAmount(subtotal.add(vatTotal));
        purchaseOrderRepository.save(po);
    }

    private String generateOrderNumber(UUID organizationId) {
        long seq = purchaseOrderRepository.getNextOrderNumber(organizationId);
        return String.format("ЗП-%05d", seq);
    }

    private PurchaseOrderResponse buildFullResponse(PurchaseOrder po) {
        List<PurchaseOrderItem> items = purchaseOrderItemRepository
                .findByPurchaseOrderIdAndDeletedFalseOrderByCreatedAtAsc(po.getId());
        return buildResponse(po, items);
    }

    private PurchaseOrderResponse buildResponse(PurchaseOrder po, List<PurchaseOrderItem> items) {
        List<PurchaseOrderItemResponse> itemResponses = items.stream()
                .map(PurchaseOrderItemResponse::fromEntity)
                .toList();
        return PurchaseOrderResponse.fromEntity(po, itemResponses);
    }
}
