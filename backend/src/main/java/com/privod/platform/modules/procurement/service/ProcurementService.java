package com.privod.platform.modules.procurement.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.procurement.domain.PurchaseRequest;
import com.privod.platform.modules.procurement.domain.PurchaseRequestItem;
import com.privod.platform.modules.procurement.domain.PurchaseRequestPriority;
import com.privod.platform.modules.procurement.domain.PurchaseRequestStatus;
import com.privod.platform.modules.procurement.repository.PurchaseRequestItemRepository;
import com.privod.platform.modules.procurement.repository.PurchaseRequestRepository;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseRequestItemRequest;
import com.privod.platform.modules.procurement.web.dto.CreatePurchaseRequestRequest;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestDashboardResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestItemResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestListResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestCountersResponse;
import com.privod.platform.modules.procurement.web.dto.PurchaseRequestResponse;
import com.privod.platform.modules.procurement.web.dto.UpdatePurchaseRequestItemRequest;
import com.privod.platform.modules.procurement.web.dto.UpdatePurchaseRequestRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProcurementService {

    private final PurchaseRequestRepository purchaseRequestRepository;
    private final PurchaseRequestItemRepository purchaseRequestItemRepository;
    private final ProjectRepository projectRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PurchaseRequestListResponse> listRequests(UUID projectId, List<PurchaseRequestStatus> statuses,
                                                           PurchaseRequestPriority priority, UUID assignedToId,
                                                           UUID requestedById,
                                                           String search,
                                                           Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);
        validateUserTenant(assignedToId, organizationId);
        validateUserTenant(requestedById, organizationId);

        Specification<PurchaseRequest> spec = buildRequestSpec(
                organizationId, projectId, priority, search, statuses, assignedToId, requestedById
        );

        Page<PurchaseRequest> page = purchaseRequestRepository.findAll(spec, pageable);
        return enrichList(page, organizationId);
    }

    @Transactional(readOnly = true)
    public PurchaseRequestCountersResponse getRequestCounters(
            UUID projectId,
            PurchaseRequestPriority priority,
            String search,
            UUID requestedById
    ) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);
        validateUserTenant(requestedById, organizationId);

        Specification<PurchaseRequest> baseSpec = buildRequestSpec(
                organizationId, projectId, priority, search, List.of(), null, null
        );

        long all = purchaseRequestRepository.count(baseSpec);
        long my = requestedById == null
                ? 0L
                : purchaseRequestRepository.count(baseSpec.and(PurchaseRequestSpecification.requestedBy(requestedById)));
        long inApproval = purchaseRequestRepository.count(baseSpec.and(
                PurchaseRequestSpecification.hasStatuses(List.of(
                        PurchaseRequestStatus.SUBMITTED,
                        PurchaseRequestStatus.IN_APPROVAL
                ))
        ));
        long inWork = purchaseRequestRepository.count(baseSpec.and(
                PurchaseRequestSpecification.hasStatuses(List.of(
                        PurchaseRequestStatus.APPROVED,
                        PurchaseRequestStatus.ASSIGNED,
                        PurchaseRequestStatus.ORDERED
                ))
        ));
        long delivered = purchaseRequestRepository.count(baseSpec.and(
                PurchaseRequestSpecification.hasStatuses(List.of(
                        PurchaseRequestStatus.DELIVERED,
                        PurchaseRequestStatus.CLOSED
                ))
        ));

        return new PurchaseRequestCountersResponse(all, my, inApproval, inWork, delivered);
    }

    @Transactional(readOnly = true)
    public PurchaseRequestResponse getRequest(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseRequest pr = getRequestOrThrow(id, organizationId);
        List<PurchaseRequestItemResponse> items = purchaseRequestItemRepository
                .findByRequestIdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(PurchaseRequestItemResponse::fromEntity)
                .toList();
        return PurchaseRequestResponse.fromEntity(pr, items);
    }

    @Transactional
    public PurchaseRequestResponse createRequest(CreatePurchaseRequestRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID requestedById = SecurityUtils.requireCurrentUserId();
        User requestedBy = getUserOrThrow(requestedById, organizationId);
        validateProjectTenant(request.projectId(), organizationId);
        validateContractTenant(request.contractId(), organizationId);

        String name = generateRequestName();

        PurchaseRequest pr = PurchaseRequest.builder()
                .organizationId(organizationId)
                .name(name)
                .requestDate(request.requestDate())
                .projectId(request.projectId())
                .contractId(request.contractId())
                .specificationId(request.specificationId())
                .status(PurchaseRequestStatus.DRAFT)
                .priority(request.priority() != null ? request.priority() : PurchaseRequestPriority.MEDIUM)
                .requestedById(requestedById)
                .requestedByName(formatFullName(requestedBy.getFirstName(), requestedBy.getLastName()))
                .notes(request.notes())
                .build();

        pr = purchaseRequestRepository.save(pr);
        auditService.logCreate("PurchaseRequest", pr.getId());

        log.info("Заявка на закупку создана: {} ({})", pr.getName(), pr.getId());
        return PurchaseRequestResponse.fromEntity(pr, List.of());
    }

    @Transactional
    public PurchaseRequestResponse updateRequest(UUID id, UpdatePurchaseRequestRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseRequest pr = getRequestOrThrow(id, organizationId);
        validateDraftStatus(pr.getStatus());

        if (request.requestDate() != null) {
            pr.setRequestDate(request.requestDate());
        }
        if (request.projectId() != null) {
            validateProjectTenant(request.projectId(), organizationId);
            pr.setProjectId(request.projectId());
        }
        if (request.contractId() != null) {
            validateContractTenant(request.contractId(), organizationId);
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseRequest pr = getRequestOrThrow(requestId, organizationId);
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseRequestItem item = getItemOrThrow(itemId, organizationId);
        PurchaseRequest pr = getRequestOrThrow(item.getRequestId(), organizationId);
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseRequestItem item = getItemOrThrow(itemId, organizationId);
        PurchaseRequest pr = getRequestOrThrow(item.getRequestId(), organizationId);
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseRequest pr = getRequestOrThrow(id, organizationId);
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateUserTenant(assignedToId, organizationId);
        PurchaseRequest pr = getRequestOrThrow(id, organizationId);
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
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseRequest pr = getRequestOrThrow(requestId, organizationId);
        BigDecimal total = purchaseRequestItemRepository.sumAmountByRequestId(requestId);
        pr.setTotalAmount(total != null ? total : BigDecimal.ZERO);
        purchaseRequestRepository.save(pr);

        log.debug("Итого заявки пересчитано: {} - сумма={}", requestId, pr.getTotalAmount());
    }

    @Transactional(readOnly = true)
    public PurchaseRequestDashboardResponse getDashboardSummary(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);

        Map<String, Long> statusCounts = new HashMap<>();
        List<Object[]> statusData = purchaseRequestRepository.countByStatusForProjectAndOrganizationId(projectId, organizationId);
        for (Object[] row : statusData) {
            PurchaseRequestStatus status = (PurchaseRequestStatus) row[0];
            Long count = (Long) row[1];
            statusCounts.put(status.name(), count);
        }

        BigDecimal totalAmount = purchaseRequestRepository.sumTotalAmountForProjectAndOrganizationId(projectId, organizationId);

        return new PurchaseRequestDashboardResponse(
                statusCounts,
                totalAmount != null ? totalAmount : BigDecimal.ZERO
        );
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private Specification<PurchaseRequest> buildRequestSpec(
            UUID organizationId,
            UUID projectId,
            PurchaseRequestPriority priority,
            String search,
            List<PurchaseRequestStatus> statuses,
            UUID assignedToId,
            UUID requestedById
    ) {
        Specification<PurchaseRequest> spec = Specification
                .where(PurchaseRequestSpecification.notDeleted())
                .and(PurchaseRequestSpecification.belongsToOrganization(organizationId))
                .and(PurchaseRequestSpecification.hasProject(projectId))
                .and(PurchaseRequestSpecification.hasPriority(priority))
                .and(PurchaseRequestSpecification.hasStatuses(statuses))
                .and(PurchaseRequestSpecification.assignedTo(assignedToId))
                .and(PurchaseRequestSpecification.requestedBy(requestedById));
        if (StringUtils.hasText(search)) {
            spec = spec.and(PurchaseRequestSpecification.quickSearch(search));
        }
        return spec;
    }

    private Page<PurchaseRequestListResponse> enrichList(Page<PurchaseRequest> page, UUID organizationId) {
        List<UUID> projectIds = page.getContent().stream()
                .map(PurchaseRequest::getProjectId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<UUID> assigneeIds = page.getContent().stream()
                .map(PurchaseRequest::getAssignedToId)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        List<UUID> requestIds = page.getContent().stream()
                .map(PurchaseRequest::getId)
                .toList();

        Map<UUID, String> projectNameMap = resolveProjectNames(projectIds, organizationId);
        Map<UUID, String> assigneeNameMap = resolveUserNames(assigneeIds, organizationId);
        Map<UUID, Long> itemCountMap = resolveItemCounts(requestIds);

        List<PurchaseRequestListResponse> enriched = page.getContent().stream()
                .map(request -> PurchaseRequestListResponse.fromEntity(
                        request,
                        request.getProjectId() != null ? projectNameMap.get(request.getProjectId()) : null,
                        request.getAssignedToId() != null ? assigneeNameMap.get(request.getAssignedToId()) : null,
                        itemCountMap.get(request.getId())
                ))
                .toList();

        return new PageImpl<>(enriched, page.getPageable(), page.getTotalElements());
    }

    private Map<UUID, String> resolveProjectNames(List<UUID> projectIds, UUID organizationId) {
        if (projectIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> map = new HashMap<>();
        for (Object[] row : projectRepository.findNamesByIdsAndOrganizationId(projectIds, organizationId)) {
            map.put((UUID) row[0], (String) row[1]);
        }
        return map;
    }

    private Map<UUID, String> resolveUserNames(List<UUID> userIds, UUID organizationId) {
        if (userIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, String> map = new HashMap<>();
        for (Object[] row : userRepository.findNamesByIdsAndOrganizationId(userIds, organizationId)) {
            UUID id = (UUID) row[0];
            String firstName = (String) row[1];
            String lastName = (String) row[2];
            map.put(id, formatFullName(firstName, lastName));
        }
        return map;
    }

    private Map<UUID, Long> resolveItemCounts(List<UUID> requestIds) {
        if (requestIds.isEmpty()) {
            return Map.of();
        }
        Map<UUID, Long> map = new HashMap<>();
        for (Object[] row : purchaseRequestItemRepository.countByRequestIds(requestIds)) {
            map.put((UUID) row[0], (Long) row[1]);
        }
        return map;
    }

    private String formatFullName(String firstName, String lastName) {
        if (!StringUtils.hasText(firstName) && !StringUtils.hasText(lastName)) {
            return null;
        }
        if (!StringUtils.hasText(firstName)) {
            return lastName.trim();
        }
        if (!StringUtils.hasText(lastName)) {
            return firstName.trim();
        }
        return firstName.trim() + " " + lastName.trim();
    }

    private PurchaseRequestResponse transitionStatus(UUID id, PurchaseRequestStatus targetStatus, String actionLabel) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        PurchaseRequest pr = getRequestOrThrow(id, organizationId);
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

    private PurchaseRequest getRequestOrThrow(UUID id, UUID organizationId) {
        return purchaseRequestRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Заявка на закупку не найдена: " + id));
    }

    private PurchaseRequestItem getItemOrThrow(UUID itemId, UUID organizationId) {
        PurchaseRequestItem item = purchaseRequestItemRepository.findById(itemId)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Позиция заявки не найдена: " + itemId));
        getRequestOrThrow(item.getRequestId(), organizationId);
        return item;
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) {
            return;
        }
        projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
    }

    private void validateContractTenant(UUID contractId, UUID organizationId) {
        if (contractId == null) {
            return;
        }
        contractRepository.findByIdAndOrganizationIdAndDeletedFalse(contractId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Контракт не найден: " + contractId));
    }

    private void validateUserTenant(UUID userId, UUID organizationId) {
        if (userId == null) {
            return;
        }
        userRepository.findByIdAndOrganizationIdAndDeletedFalse(userId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + userId));
    }

    private User getUserOrThrow(UUID userId, UUID organizationId) {
        return userRepository.findByIdAndOrganizationIdAndDeletedFalse(userId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + userId));
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
