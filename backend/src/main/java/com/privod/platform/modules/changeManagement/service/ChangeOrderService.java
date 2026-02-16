package com.privod.platform.modules.changeManagement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.changeManagement.domain.ChangeOrder;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderItem;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequest;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderRequestStatus;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderStatus;
import com.privod.platform.modules.changeManagement.repository.ChangeOrderItemRepository;
import com.privod.platform.modules.changeManagement.repository.ChangeOrderRepository;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderItemResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderResponse;
import com.privod.platform.modules.changeManagement.web.dto.ChangeOrderStatusRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeOrderItemRequest;
import com.privod.platform.modules.changeManagement.web.dto.CreateChangeOrderRequest;
import com.privod.platform.modules.changeManagement.web.dto.UpdateChangeOrderRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
public class ChangeOrderService {

    private final ChangeOrderRepository changeOrderRepository;
    private final ChangeOrderItemRepository changeOrderItemRepository;
    private final ChangeOrderRequestService changeOrderRequestService;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ChangeOrderResponse> listAll(Pageable pageable) {
        return changeOrderRepository.findByDeletedFalse(pageable)
                .map(ChangeOrderResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ChangeOrderResponse> listByProject(UUID projectId, Pageable pageable) {
        return changeOrderRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(ChangeOrderResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ChangeOrderResponse> listByContract(UUID contractId, Pageable pageable) {
        return changeOrderRepository.findByContractIdAndDeletedFalse(contractId, pageable)
                .map(ChangeOrderResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ChangeOrderResponse getChangeOrder(UUID id) {
        ChangeOrder order = getChangeOrderOrThrow(id);
        return ChangeOrderResponse.fromEntity(order);
    }

    @Transactional
    public ChangeOrderResponse createChangeOrder(CreateChangeOrderRequest request) {
        // Validate chain: if COR is provided, it must be APPROVED
        if (request.changeOrderRequestId() != null) {
            ChangeOrderRequest cor = changeOrderRequestService
                    .getChangeOrderRequestOrThrow(request.changeOrderRequestId());
            if (cor.getStatus() != ChangeOrderRequestStatus.APPROVED) {
                throw new IllegalStateException(
                        "Создать ордер на изменение можно только на основе утверждённого запроса");
            }
        }

        String number = generateOrderNumber();

        BigDecimal originalAmount = request.originalContractAmount() != null
                ? request.originalContractAmount() : BigDecimal.ZERO;

        ChangeOrder order = ChangeOrder.builder()
                .projectId(request.projectId())
                .contractId(request.contractId())
                .number(number)
                .title(request.title())
                .description(request.description())
                .changeOrderType(request.changeOrderType())
                .status(ChangeOrderStatus.DRAFT)
                .totalAmount(BigDecimal.ZERO)
                .scheduleImpactDays(request.scheduleImpactDays() != null ? request.scheduleImpactDays() : 0)
                .originalContractAmount(originalAmount)
                .revisedContractAmount(originalAmount)
                .changeOrderRequestId(request.changeOrderRequestId())
                .build();

        order = changeOrderRepository.save(order);
        auditService.logCreate("ChangeOrder", order.getId());

        log.info("Ордер на изменение создан: {} - {} ({})", order.getNumber(), order.getTitle(), order.getId());
        return ChangeOrderResponse.fromEntity(order);
    }

    @Transactional
    public ChangeOrderResponse updateChangeOrder(UUID id, UpdateChangeOrderRequest request) {
        ChangeOrder order = getChangeOrderOrThrow(id);

        if (order.getStatus() != ChangeOrderStatus.DRAFT) {
            throw new IllegalStateException(
                    "Редактирование ордера на изменение возможно только в статусе Черновик");
        }

        if (request.title() != null) {
            order.setTitle(request.title());
        }
        if (request.description() != null) {
            order.setDescription(request.description());
        }
        if (request.changeOrderType() != null) {
            order.setChangeOrderType(request.changeOrderType());
        }
        if (request.originalContractAmount() != null) {
            order.setOriginalContractAmount(request.originalContractAmount());
        }
        if (request.scheduleImpactDays() != null) {
            order.setScheduleImpactDays(request.scheduleImpactDays());
        }

        order = changeOrderRepository.save(order);
        auditService.logUpdate("ChangeOrder", order.getId(), "multiple", null, null);

        log.info("Ордер на изменение обновлён: {} ({})", order.getNumber(), order.getId());
        return ChangeOrderResponse.fromEntity(order);
    }

    @Transactional
    public ChangeOrderResponse changeStatus(UUID id, ChangeOrderStatusRequest request) {
        ChangeOrder order = getChangeOrderOrThrow(id);
        ChangeOrderStatus oldStatus = order.getStatus();
        ChangeOrderStatus newStatus = request.status();

        if (!order.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести ордер на изменение из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        order.setStatus(newStatus);

        if (newStatus == ChangeOrderStatus.APPROVED) {
            order.setApprovedById(request.approvedById());
            order.setApprovedDate(LocalDate.now());
            // Recalculate revised contract amount on approval
            recalculateRevisedContractAmount(order);
        }

        if (newStatus == ChangeOrderStatus.EXECUTED) {
            order.setExecutedDate(LocalDate.now());
        }

        order = changeOrderRepository.save(order);
        auditService.logStatusChange("ChangeOrder", order.getId(), oldStatus.name(), newStatus.name());

        log.info("Статус ордера на изменение изменён: {} с {} на {} ({})",
                order.getNumber(), oldStatus, newStatus, order.getId());
        return ChangeOrderResponse.fromEntity(order);
    }

    // --- Change Order Items ---

    @Transactional(readOnly = true)
    public List<ChangeOrderItemResponse> listItems(UUID changeOrderId) {
        getChangeOrderOrThrow(changeOrderId);
        return changeOrderItemRepository
                .findByChangeOrderIdAndDeletedFalseOrderBySortOrderAsc(changeOrderId)
                .stream()
                .map(ChangeOrderItemResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ChangeOrderItemResponse addItem(CreateChangeOrderItemRequest request) {
        ChangeOrder order = getChangeOrderOrThrow(request.changeOrderId());

        if (order.getStatus() != ChangeOrderStatus.DRAFT) {
            throw new IllegalStateException(
                    "Добавление позиций возможно только для ордера в статусе Черновик");
        }

        BigDecimal totalPrice = calculateItemTotalPrice(request.quantity(), request.unitPrice());

        ChangeOrderItem item = ChangeOrderItem.builder()
                .changeOrderId(request.changeOrderId())
                .description(request.description())
                .quantity(request.quantity())
                .unit(request.unit())
                .unitPrice(request.unitPrice())
                .totalPrice(totalPrice)
                .costCodeId(request.costCodeId())
                .wbsNodeId(request.wbsNodeId())
                .sortOrder(request.sortOrder())
                .build();

        item = changeOrderItemRepository.save(item);

        // Recalculate change order total
        recalculateTotalAmount(order);

        log.info("Позиция ордера на изменение добавлена: {} к ордеру {} ({})",
                item.getDescription(), order.getNumber(), item.getId());
        return ChangeOrderItemResponse.fromEntity(item);
    }

    @Transactional
    public void removeItem(UUID itemId) {
        ChangeOrderItem item = changeOrderItemRepository.findById(itemId)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Позиция ордера не найдена: " + itemId));

        ChangeOrder order = getChangeOrderOrThrow(item.getChangeOrderId());

        if (order.getStatus() != ChangeOrderStatus.DRAFT) {
            throw new IllegalStateException(
                    "Удаление позиций возможно только для ордера в статусе Черновик");
        }

        item.softDelete();
        changeOrderItemRepository.save(item);

        // Recalculate change order total
        recalculateTotalAmount(order);

        log.info("Позиция ордера на изменение удалена: {} ({})", item.getDescription(), item.getId());
    }

    @Transactional
    public void deleteChangeOrder(UUID id) {
        ChangeOrder order = getChangeOrderOrThrow(id);
        order.softDelete();
        changeOrderRepository.save(order);
        auditService.logDelete("ChangeOrder", order.getId());

        log.info("Ордер на изменение удалён: {} ({})", order.getNumber(), order.getId());
    }

    @Transactional(readOnly = true)
    public BigDecimal calculateRevisedContractAmount(UUID contractId, BigDecimal originalAmount) {
        BigDecimal approvedSum = changeOrderRepository
                .sumTotalAmountByContractIdAndStatus(contractId, ChangeOrderStatus.APPROVED);
        BigDecimal executedSum = changeOrderRepository
                .sumTotalAmountByContractIdAndStatus(contractId, ChangeOrderStatus.EXECUTED);
        BigDecimal totalChangeOrders = approvedSum.add(executedSum);
        BigDecimal base = originalAmount != null ? originalAmount : BigDecimal.ZERO;
        return base.add(totalChangeOrders);
    }

    ChangeOrder getChangeOrderOrThrow(UUID id) {
        return changeOrderRepository.findById(id)
                .filter(o -> !o.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Ордер на изменение не найден: " + id));
    }

    private void recalculateTotalAmount(ChangeOrder order) {
        BigDecimal itemsTotal = changeOrderItemRepository.sumTotalPriceByChangeOrderId(order.getId());
        order.setTotalAmount(itemsTotal);
        recalculateRevisedContractAmount(order);
        changeOrderRepository.save(order);
    }

    private void recalculateRevisedContractAmount(ChangeOrder order) {
        BigDecimal original = order.getOriginalContractAmount() != null
                ? order.getOriginalContractAmount() : BigDecimal.ZERO;
        order.setRevisedContractAmount(original.add(order.getTotalAmount()));
    }

    private BigDecimal calculateItemTotalPrice(BigDecimal quantity, BigDecimal unitPrice) {
        if (quantity == null || unitPrice == null) {
            return BigDecimal.ZERO;
        }
        return quantity.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
    }

    private String generateOrderNumber() {
        long seq = changeOrderRepository.getNextNumberSequence();
        return String.format("CO-%05d", seq);
    }
}
