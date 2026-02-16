package com.privod.platform.modules.procurement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.procurement.domain.PurchaseRequest;
import com.privod.platform.modules.procurement.domain.PurchaseRequestItem;
import com.privod.platform.modules.procurement.domain.PurchaseRequestPriority;
import com.privod.platform.modules.procurement.domain.PurchaseRequestStatus;
import com.privod.platform.modules.procurement.repository.PurchaseRequestItemRepository;
import com.privod.platform.modules.procurement.repository.PurchaseRequestRepository;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseRequestItemRequest;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseRequestRequest;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestDashboardResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestItemResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestListResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestResponse;
import com.privod.platform.modules.procurement.web.dto.UpdatePurchaseRequestItemRequest;
import com.privod.platform.modules.procurement.web.dto.UpdatePurchaseRequestRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcurementService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseRequestItemRepository purchaseRequestItemRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PurchaseRequestListResponse> listRequests(UUID projectId, PurchaseRequestStatus status,
                                                           PurchaseRequestPriority priority, UUID assignedToId,
                                                           Pageable pageable) {
        Specification<PurchaseRequest> spec = Specification
                .where(PurchaseRequestSpecification.notDeleted())
                .and(PurchaseRequestSpecification.hasProject(projectId))
                .and(PurchaseRequestSpecification.hasStatus(status))
                .and(PurchaseRequestSpecification.hasPriority(priority))
                .and(PurchaseRequestSpecification.assignedTo(assignedToId));

        return purchaseRequestRepository.findAll(spec, pageable).map(PurchaseRequestListResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PurchaseRequestResponse getRequest(UUID id) {
        PurchaseRequest pr = getRequestOrThrow(id);
        List<PurchaseRequestItemResponse> items = purchaseRequestItemRepository
                .findByRequestIdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(PurchaseRequestItemResponse::fromEntity)
                .toList();
        return PurchaseRequestResponse.fromEntity(pr, items);
    }

    @Transactional
    public PurchaseRequestResponse createRequest(CreatePurchaseRequestRequest request) {
        String name = generateRequestName();

        PurchaseRequest pr = PurchaseRequest.builder()
                .name(name)
                .requestDate(request.requestDate())
                .projectId(request.projectId())
                .contractId(request.contractId())
                .specificationId(request.specificationId())
                .status(PurchaseRequestStatus.DRAFT)
                .priority(request.priority() != null ? request.priority() : PurchaseRequestPriority.MEDIUM)
                .requestedById(request.requestedById())
                .requestedByName(request.requestedByName())
                .notes(request.notes())
                .build();

        pr = purchaseRequestRepository.save(pr);
        auditService.logCreate("PurchaseRequest", pr.getId());

        log.info("Заявка на закупку создана: {} ({})", pr.getName(), pr.getId());
        return PurchaseRequestResponse.fromEntity(pr, List.of());
    }

    @Transactional
    public PurchaseRequestResponse updateRequest(UUID id, UpdatePurchaseRequestRequest request) {
        PurchaseRequest pr = getRequestOrThrow(id);
        validateDraftStatus(pr.getStatus());

        if (request.requestDate() != null) {
            pr.setRequestDate(request.requestDate());
        }
        if (request.projectId() != null) {
            pr.setProjectId(request.projectId());
        }
        if (request.contractId() != null) {
            pr.setContractId(request.contractId());
        }
        if (request.specificationId() != null) {
            pr.setSpecificationId(request.specificationId());
        }
        if (request.priority() != null) {
            pr.setPriority(request.priority());
        }
        if (request.requestedByName() != null) {
            pr.setRequestedByName(request.requestedByName());
        }
        if (request.notes() != null) {
            pr.setNotes(request.notes());
        }

        pr = purchaseRequestRepository.save(pr);
        auditService.logUpdate("PurchaseRequest", pr.getId(), "multiple", null, null);

        log.info("Заявка на закупку обновлена: {} ({})", pr.getName(), pr.getId());
        List<PurchaseRequestItemResponse> items = purchaseRequestItemRepository
                .findByRequestIdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(PurchaseRequestItemResponse::fromEntity)
                .toList();
        return PurchaseRequestResponse.fromEntity(pr, items);
    }

    @Transactional
    public PurchaseRequestItemResponse addItem(UUID requestId, CreatePurchaseRequestItemRequest request) {
        PurchaseRequest pr = getRequestOrThrow(requestId);
        validateDraftStatus(pr.getStatus());

        PurchaseRequestItem item = PurchaseRequestItem.builder()
                .requestId(requestId)
                .specItemId(request.specItemId())
                .sequence(request.sequence() != null ? request.sequence() : 0)
                .name(request.name())
                .quantity(request.quantity())
                .unitOfMeasure(request.unitOfMeasure())
                .unitPrice(request.unitPrice())
                .notes(request.notes())
                .build();

        item.computeAmount();
        item = purchaseRequestItemRepository.save(item);
        auditService.logCreate("PurchaseRequestItem", item.getId());

        recalculateTotals(requestId);

        log.info("Позиция заявки добавлена: {} в заявку {}", item.getName(), requestId);
        return PurchaseRequestItemResponse.fromEntity(item);
    }

    @Transactional
    public PurchaseRequestItemResponse updateItem(UUID itemId, UpdatePurchaseRequestItemRequest request) {
        PurchaseRequestItem item = getItemOrThrow(itemId);
        PurchaseRequest pr = getRequestOrThrow(item.getRequestId());
        validateDraftStatus(pr.getStatus());

        if (request.specItemId() != null) {
            item.setSpecItemId(request.specItemId());
        }
        if (request.sequence() != null) {
            item.setSequence(request.sequence());
        }
        if (request.name() != null) {
            item.setName(request.name());
        }
        if (request.quantity() != null) {
            item.setQuantity(request.quantity());
        }
        if (request.unitOfMeasure() != null) {
            item.setUnitOfMeasure(request.unitOfMeasure());
        }
        if (request.unitPrice() != null) {
            item.setUnitPrice(request.unitPrice());
        }
        if (request.notes() != null) {
            item.setNotes(request.notes());
        }

        item.computeAmount();
        item = purchaseRequestItemRepository.save(item);
        auditService.logUpdate("PurchaseRequestItem", item.getId(), "multiple", null, null);

        recalculateTotals(item.getRequestId());

        log.info("Позиция заявки обновлена: {} ({})", item.getName(), item.getId());
        return PurchaseRequestItemResponse.fromEntity(item);
    }

    @Transactional
    public void removeItem(UUID itemId) {
        PurchaseRequestItem item = getItemOrThrow(itemId);
        PurchaseRequest pr = getRequestOrThrow(item.getRequestId());
        validateDraftStatus(pr.getStatus());

        item.softDelete();
        purchaseRequestItemRepository.save(item);
        auditService.logDelete("PurchaseRequestItem", itemId);

        recalculateTotals(item.getRequestId());

        log.info("Позиция заявки удалена: {}", itemId);
    }

    @Transactional
    public PurchaseRequestResponse submitRequest(UUID id) {
        return transitionStatus(id, PurchaseRequestStatus.SUBMITTED, "отправлена");
    }

    @Transactional
    public PurchaseRequestResponse approveRequest(UUID id) {
        return transitionStatus(id, PurchaseRequestStatus.APPROVED, "согласована");
    }

    @Transactional
    public PurchaseRequestResponse rejectRequest(UUID id, String reason) {
        PurchaseRequest pr = getRequestOrThrow(id);
        PurchaseRequestStatus oldStatus = pr.getStatus();

        if (!pr.canTransitionTo(PurchaseRequestStatus.REJECTED)) {
            throw new IllegalStateException(
                    String.format("Невозможно отклонить заявку из статуса %s",
                            oldStatus.getDisplayName()));
        }

        pr.setStatus(PurchaseRequestStatus.REJECTED);
        pr.setRejectionReason(reason);
        pr = purchaseRequestRepository.save(pr);
        auditService.logStatusChange("PurchaseRequest", pr.getId(), oldStatus.name(), PurchaseRequestStatus.REJECTED.name());

        log.info("Заявка на закупку отклонена: {} ({}) - причина: {}", pr.getName(), pr.getId(), reason);
        List<PurchaseRequestItemResponse> items = purchaseRequestItemRepository
                .findByRequestIdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(PurchaseRequestItemResponse::fromEntity)
                .toList();
        return PurchaseRequestResponse.fromEntity(pr, items);
    }

    @Transactional
    public PurchaseRequestResponse assignRequest(UUID id, UUID assignedToId) {
        PurchaseRequest pr = getRequestOrThrow(id);
        PurchaseRequestStatus oldStatus = pr.getStatus();

        if (!pr.canTransitionTo(PurchaseRequestStatus.ASSIGNED)) {
            throw new IllegalStateException(
                    String.format("Невозможно назначить заявку из статуса %s",
                            oldStatus.getDisplayName()));
        }

        pr.setStatus(PurchaseRequestStatus.ASSIGNED);
        pr.setAssignedToId(assignedToId);
        pr = purchaseRequestRepository.save(pr);
        auditService.logStatusChange("PurchaseRequest", pr.getId(), oldStatus.name(), PurchaseRequestStatus.ASSIGNED.name());

        log.info("Заявка на закупку назначена: {} ({}) -> {}", pr.getName(), pr.getId(), assignedToId);
        List<PurchaseRequestItemResponse> items = purchaseRequestItemRepository
                .findByRequestIdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(PurchaseRequestItemResponse::fromEntity)
                .toList();
        return PurchaseRequestResponse.fromEntity(pr, items);
    }

    @Transactional
    public PurchaseRequestResponse markOrdered(UUID id) {
        return transitionStatus(id, PurchaseRequestStatus.ORDERED, "заказано");
    }

    @Transactional
    public PurchaseRequestResponse markDelivered(UUID id) {
        return transitionStatus(id, PurchaseRequestStatus.DELIVERED, "доставлено");
    }

    @Transactional
    public PurchaseRequestResponse closeRequest(UUID id) {
        return transitionStatus(id, PurchaseRequestStatus.CLOSED, "закрыта");
    }

    @Transactional
    public PurchaseRequestResponse cancelRequest(UUID id) {
        return transitionStatus(id, PurchaseRequestStatus.CANCELLED, "отменена");
    }

    @Transactional
    public void recalculateTotals(UUID requestId) {
        PurchaseRequest pr = getRequestOrThrow(requestId);
        BigDecimal total = purchaseRequestItemRepository.sumAmountByRequestId(requestId);
        pr.setTotalAmount(total != null ? total : BigDecimal.ZERO);
        purchaseRequestRepository.save(pr);

        log.debug("Итого заявки пересчитано: {} - сумма={}", requestId, pr.getTotalAmount());
    }

    @Transactional(readOnly = true)
    public PurchaseRequestDashboardResponse getDashboardSummary(UUID projectId) {
        Map<String, Long> statusCounts = new HashMap<>();
        List<Object[]> statusData = purchaseRequestRepository.countByStatusForProject(projectId);
        for (Object[] row : statusData) {
            PurchaseRequestStatus status = (PurchaseRequestStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status.name(), count);
        }

        BigDecimal totalAmount = purchaseRequestRepository.sumTotalAmountForProject(projectId);

        return new PurchaseRequestDashboardResponse(
                statusCounts,
                totalAmount != null ? totalAmount : BigDecimal.ZERO
        );
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private PurchaseRequestResponse transitionStatus(UUID id, PurchaseRequestStatus targetStatus, String actionLabel) {
        PurchaseRequest pr = getRequestOrThrow(id);
        PurchaseRequestStatus oldStatus = pr.getStatus();

        if (!pr.canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести заявку из статуса %s в %s",
                            oldStatus.getDisplayName(), targetStatus.getDisplayName()));
        }

        pr.setStatus(targetStatus);
        pr = purchaseRequestRepository.save(pr);
        auditService.logStatusChange("PurchaseRequest", pr.getId(), oldStatus.name(), targetStatus.name());

        log.info("Заявка на закупку {}: {} ({})", actionLabel, pr.getName(), pr.getId());
        List<PurchaseRequestItemResponse> items = purchaseRequestItemRepository
                .findByRequestIdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(PurchaseRequestItemResponse::fromEntity)
                .toList();
        return PurchaseRequestResponse.fromEntity(pr, items);
    }

    private PurchaseRequest getRequestOrThrow(UUID id) {
        return purchaseRequestRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Заявка на закупку не найдена: " + id));
    }

    private PurchaseRequestItem getItemOrThrow(UUID itemId) {
        return purchaseRequestItemRepository.findById(itemId)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Позиция заявки не найдена: " + itemId));
    }

    private void validateDraftStatus(PurchaseRequestStatus status) {
        if (status != PurchaseRequestStatus.DRAFT) {
            throw new IllegalStateException(
                    String.format("Редактирование заявки возможно только в статусе Черновик. Текущий статус: %s",
                            status.getDisplayName()));
        }
    }

    private String generateRequestName() {
        long seq = purchaseRequestRepository.getNextNameSequence();
        return String.format("ЗП-%05d", seq);
    }
}
