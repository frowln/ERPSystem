package com.privod.platform.modules.estimate.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.estimate.domain.Estimate;
import com.privod.platform.modules.estimate.domain.EstimateItem;
import com.privod.platform.modules.estimate.domain.EstimateStatus;
import com.privod.platform.modules.estimate.domain.EstimateVersion;
import com.privod.platform.modules.estimate.repository.EstimateItemRepository;
import com.privod.platform.modules.estimate.repository.EstimateRepository;
import com.privod.platform.modules.estimate.repository.EstimateVersionRepository;
import com.privod.platform.modules.estimate.web.dto.ChangeEstimateStatusRequest;
import com.privod.platform.modules.estimate.web.dto.CreateEstimateItemRequest;
import com.privod.platform.modules.estimate.web.dto.CreateEstimateRequest;
import com.privod.platform.modules.estimate.web.dto.CreateFromSpecRequest;
import com.privod.platform.modules.estimate.web.dto.CreateVersionRequest;
import com.privod.platform.modules.estimate.web.dto.EstimateFinancialSummaryResponse;
import com.privod.platform.modules.estimate.web.dto.EstimateItemResponse;
import com.privod.platform.modules.estimate.web.dto.EstimateListResponse;
import com.privod.platform.modules.estimate.web.dto.EstimateResponse;
import com.privod.platform.modules.estimate.web.dto.UpdateEstimateItemRequest;
import com.privod.platform.modules.estimate.web.dto.UpdateEstimateRequest;
import com.privod.platform.modules.specification.domain.SpecItem;
import com.privod.platform.modules.specification.domain.Specification;
import com.privod.platform.modules.specification.repository.SpecItemRepository;
import com.privod.platform.modules.specification.repository.SpecificationRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EstimateService {

    private final EstimateRepository estimateRepository;
    private final EstimateItemRepository estimateItemRepository;
    private final EstimateVersionRepository estimateVersionRepository;
    private final SpecificationRepository specificationRepository;
    private final SpecItemRepository specItemRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Page<EstimateListResponse> listEstimates(UUID projectId, UUID specificationId,
                                                     EstimateStatus status, Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<Estimate> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (specificationId != null) {
                predicates.add(cb.equal(root.get("specificationId"), specificationId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return estimateRepository.findAll(spec, pageable).map(EstimateListResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public EstimateResponse getEstimate(UUID id) {
        Estimate estimate = getEstimateOrThrow(id);
        List<EstimateItemResponse> items = estimateItemRepository
                .findByEstimateIdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(EstimateItemResponse::fromEntity)
                .toList();
        return EstimateResponse.fromEntity(estimate, items);
    }

    @Transactional
    public EstimateResponse createEstimate(CreateEstimateRequest request) {
        Estimate estimate = Estimate.builder()
                .name(request.name())
                .projectId(request.projectId())
                .contractId(request.contractId())
                .specificationId(request.specificationId())
                .status(EstimateStatus.DRAFT)
                .totalAmount(BigDecimal.ZERO)
                .orderedAmount(BigDecimal.ZERO)
                .invoicedAmount(BigDecimal.ZERO)
                .totalSpent(BigDecimal.ZERO)
                .notes(request.notes())
                .build();

        estimate = estimateRepository.save(estimate);
        auditService.logCreate("Estimate", estimate.getId());

        // Create initial version
        createVersionSnapshot(estimate, "initial", "Первоначальное создание сметы");

        log.info("Estimate created: {} for project {} ({})", estimate.getName(), request.projectId(), estimate.getId());
        return EstimateResponse.fromEntity(estimate);
    }

    @Transactional
    public EstimateResponse updateEstimate(UUID id, UpdateEstimateRequest request) {
        Estimate estimate = getEstimateOrThrow(id);

        if (request.name() != null) {
            estimate.setName(request.name());
        }
        if (request.contractId() != null) {
            estimate.setContractId(request.contractId());
        }
        if (request.notes() != null) {
            estimate.setNotes(request.notes());
        }

        estimate = estimateRepository.save(estimate);
        auditService.logUpdate("Estimate", estimate.getId(), "multiple", null, null);

        log.info("Estimate updated: {} ({})", estimate.getName(), estimate.getId());
        return EstimateResponse.fromEntity(estimate);
    }

    @Transactional
    public EstimateResponse changeStatus(UUID id, ChangeEstimateStatusRequest request) {
        Estimate estimate = getEstimateOrThrow(id);
        EstimateStatus oldStatus = estimate.getStatus();
        EstimateStatus newStatus = request.status();

        if (!estimate.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести смету из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        estimate.setStatus(newStatus);
        estimate = estimateRepository.save(estimate);
        auditService.logStatusChange("Estimate", estimate.getId(), oldStatus.name(), newStatus.name());

        log.info("Estimate status changed: {} from {} to {} ({})",
                estimate.getName(), oldStatus, newStatus, estimate.getId());
        return EstimateResponse.fromEntity(estimate);
    }

    @Transactional
    public EstimateResponse approveEstimate(UUID id) {
        Estimate estimate = getEstimateOrThrow(id);
        if (!estimate.canTransitionTo(EstimateStatus.APPROVED)) {
            throw new IllegalStateException("Смета не может быть утверждена из текущего статуса");
        }

        EstimateStatus oldStatus = estimate.getStatus();
        estimate.setStatus(EstimateStatus.APPROVED);
        estimate = estimateRepository.save(estimate);
        auditService.logStatusChange("Estimate", estimate.getId(), oldStatus.name(), EstimateStatus.APPROVED.name());

        // Create approval version snapshot
        createVersionSnapshot(estimate, "approval", "Смета утверждена");

        log.info("Estimate approved: {} ({})", estimate.getName(), estimate.getId());
        return EstimateResponse.fromEntity(estimate);
    }

    @Transactional
    public EstimateResponse activateEstimate(UUID id) {
        Estimate estimate = getEstimateOrThrow(id);
        if (!estimate.canTransitionTo(EstimateStatus.ACTIVE)) {
            throw new IllegalStateException("Смета не может быть активирована из текущего статуса");
        }

        EstimateStatus oldStatus = estimate.getStatus();
        estimate.setStatus(EstimateStatus.ACTIVE);
        estimate = estimateRepository.save(estimate);
        auditService.logStatusChange("Estimate", estimate.getId(), oldStatus.name(), EstimateStatus.ACTIVE.name());

        log.info("Estimate activated: {} ({})", estimate.getName(), estimate.getId());
        return EstimateResponse.fromEntity(estimate);
    }

    @Transactional
    public EstimateResponse createFromSpecification(CreateFromSpecRequest request) {
        Specification specification = specificationRepository.findById(request.specificationId())
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Спецификация не найдена: " + request.specificationId()));

        Estimate estimate = Estimate.builder()
                .name(request.name())
                .projectId(specification.getProjectId())
                .contractId(request.contractId() != null ? request.contractId() : specification.getContractId())
                .specificationId(specification.getId())
                .status(EstimateStatus.DRAFT)
                .totalAmount(BigDecimal.ZERO)
                .orderedAmount(BigDecimal.ZERO)
                .invoicedAmount(BigDecimal.ZERO)
                .totalSpent(BigDecimal.ZERO)
                .notes(request.notes())
                .build();

        estimate = estimateRepository.save(estimate);

        // Populate items from specification
        List<SpecItem> specItems = specItemRepository
                .findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(specification.getId());

        for (SpecItem specItem : specItems) {
            EstimateItem item = EstimateItem.builder()
                    .estimateId(estimate.getId())
                    .projectId(specification.getProjectId())
                    .specItemId(specItem.getId())
                    .sequence(specItem.getSequence())
                    .name(specItem.getName())
                    .quantity(specItem.getQuantity())
                    .unitOfMeasure(specItem.getUnitOfMeasure())
                    .unitPrice(BigDecimal.ZERO)
                    .amount(BigDecimal.ZERO)
                    .orderedAmount(BigDecimal.ZERO)
                    .invoicedAmount(BigDecimal.ZERO)
                    .deliveredAmount(BigDecimal.ZERO)
                    .notes(specItem.getNotes())
                    .build();
            estimateItemRepository.save(item);
        }

        auditService.logCreate("Estimate", estimate.getId());
        createVersionSnapshot(estimate, "initial", "Создана из спецификации " + specification.getName());

        log.info("Estimate created from specification {}: {} ({})",
                specification.getName(), estimate.getName(), estimate.getId());

        List<EstimateItemResponse> items = estimateItemRepository
                .findByEstimateIdAndDeletedFalseOrderBySequenceAsc(estimate.getId())
                .stream()
                .map(EstimateItemResponse::fromEntity)
                .toList();
        return EstimateResponse.fromEntity(estimate, items);
    }

    @Transactional
    public EstimateItemResponse addItem(UUID estimateId, CreateEstimateItemRequest request) {
        Estimate estimate = getEstimateOrThrow(estimateId);

        int sequence = request.sequence() != null ? request.sequence()
                : (int) estimateItemRepository.countByEstimateIdAndDeletedFalse(estimateId) + 1;

        EstimateItem item = EstimateItem.builder()
                .estimateId(estimateId)
                .projectId(estimate.getProjectId())
                .specItemId(request.specItemId())
                .sequence(sequence)
                .name(request.name())
                .quantity(request.quantity())
                .unitOfMeasure(request.unitOfMeasure())
                .unitPrice(request.unitPrice())
                .unitPriceCustomer(request.unitPriceCustomer())
                .orderedAmount(BigDecimal.ZERO)
                .invoicedAmount(BigDecimal.ZERO)
                .deliveredAmount(BigDecimal.ZERO)
                .notes(request.notes())
                .build();

        item.calculateAmount();
        item = estimateItemRepository.save(item);
        auditService.logCreate("EstimateItem", item.getId());

        recalculateTotals(estimateId);

        log.info("Estimate item added to estimate {}: {} ({})", estimateId, item.getName(), item.getId());
        return EstimateItemResponse.fromEntity(item);
    }

    @Transactional
    public EstimateItemResponse updateItem(UUID itemId, UpdateEstimateItemRequest request) {
        EstimateItem item = getEstimateItemOrThrow(itemId);

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
        if (request.unitPriceCustomer() != null) {
            item.setUnitPriceCustomer(request.unitPriceCustomer());
        }
        if (request.orderedAmount() != null) {
            item.setOrderedAmount(request.orderedAmount());
        }
        if (request.invoicedAmount() != null) {
            item.setInvoicedAmount(request.invoicedAmount());
        }
        if (request.deliveredAmount() != null) {
            item.setDeliveredAmount(request.deliveredAmount());
        }
        if (request.notes() != null) {
            item.setNotes(request.notes());
        }
        if (request.sequence() != null) {
            item.setSequence(request.sequence());
        }

        item.calculateAmount();
        item = estimateItemRepository.save(item);
        auditService.logUpdate("EstimateItem", item.getId(), "multiple", null, null);

        recalculateTotals(item.getEstimateId());

        log.info("Estimate item updated: {} ({})", item.getName(), item.getId());
        return EstimateItemResponse.fromEntity(item);
    }

    @Transactional
    public void removeItem(UUID itemId) {
        EstimateItem item = getEstimateItemOrThrow(itemId);
        UUID estimateId = item.getEstimateId();
        item.softDelete();
        estimateItemRepository.save(item);
        auditService.logDelete("EstimateItem", itemId);

        recalculateTotals(estimateId);
        log.info("Estimate item removed: {} ({})", item.getName(), itemId);
    }

    @Transactional(readOnly = true)
    public List<EstimateItemResponse> getItems(UUID estimateId) {
        getEstimateOrThrow(estimateId);
        return estimateItemRepository.findByEstimateIdAndDeletedFalseOrderBySequenceAsc(estimateId)
                .stream()
                .map(EstimateItemResponse::fromEntity)
                .toList();
    }

    @Transactional
    public EstimateResponse recalculateTotals(UUID estimateId) {
        Estimate estimate = getEstimateOrThrow(estimateId);

        BigDecimal totalAmount = estimateItemRepository.sumAmountByEstimateId(estimateId);
        BigDecimal orderedAmount = estimateItemRepository.sumOrderedAmountByEstimateId(estimateId);
        BigDecimal invoicedAmount = estimateItemRepository.sumInvoicedAmountByEstimateId(estimateId);

        estimate.setTotalAmount(totalAmount);
        estimate.setOrderedAmount(orderedAmount);
        estimate.setInvoicedAmount(invoicedAmount);
        estimate.setTotalSpent(orderedAmount);

        estimate = estimateRepository.save(estimate);

        log.debug("Estimate totals recalculated: {} - total={}, ordered={}, invoiced={}",
                estimate.getName(), totalAmount, orderedAmount, invoicedAmount);
        return EstimateResponse.fromEntity(estimate);
    }

    @Transactional
    public void createVersion(UUID estimateId, CreateVersionRequest request) {
        Estimate estimate = getEstimateOrThrow(estimateId);
        createVersionSnapshot(estimate, request.reason(), request.comment());
        log.info("Estimate version created for: {} ({})", estimate.getName(), estimateId);
    }

    @Transactional(readOnly = true)
    public EstimateFinancialSummaryResponse getFinancialSummary(UUID estimateId) {
        Estimate estimate = getEstimateOrThrow(estimateId);

        return new EstimateFinancialSummaryResponse(
                estimate.getTotalAmount(),
                estimate.getOrderedAmount(),
                estimate.getInvoicedAmount(),
                estimate.getTotalSpent(),
                estimate.getBalance(),
                estimate.getVarianceAmount(),
                estimate.getVariancePercent()
        );
    }

    @Transactional(readOnly = true)
    public EstimateFinancialSummaryResponse getProjectEstimateSummary(UUID projectId) {
        List<Estimate> estimates = estimateRepository.findByProjectIdAndDeletedFalse(projectId);

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal orderedAmount = BigDecimal.ZERO;
        BigDecimal invoicedAmount = BigDecimal.ZERO;
        BigDecimal totalSpent = BigDecimal.ZERO;

        for (Estimate estimate : estimates) {
            totalAmount = totalAmount.add(estimate.getTotalAmount());
            orderedAmount = orderedAmount.add(estimate.getOrderedAmount());
            invoicedAmount = invoicedAmount.add(estimate.getInvoicedAmount());
            totalSpent = totalSpent.add(estimate.getTotalSpent());
        }

        BigDecimal balance = totalAmount.subtract(totalSpent);
        BigDecimal varianceAmount = totalAmount.subtract(orderedAmount);
        BigDecimal variancePercent = totalAmount.compareTo(BigDecimal.ZERO) == 0
                ? BigDecimal.ZERO
                : varianceAmount.multiply(new BigDecimal("100")).divide(totalAmount, 2, RoundingMode.HALF_UP);

        return new EstimateFinancialSummaryResponse(
                totalAmount,
                orderedAmount,
                invoicedAmount,
                totalSpent,
                balance,
                varianceAmount,
                variancePercent
        );
    }

    private void createVersionSnapshot(Estimate estimate, String reason, String comment) {
        // Mark previous current version as not current
        estimateVersionRepository.findByEstimateIdAndIsCurrentTrue(estimate.getId())
                .ifPresent(v -> {
                    v.setCurrent(false);
                    estimateVersionRepository.save(v);
                });

        long versionCount = estimateVersionRepository.countByEstimateId(estimate.getId());
        String versionNumber = "v" + (versionCount + 1);

        String versionData = null;
        try {
            List<EstimateItem> items = estimateItemRepository
                    .findByEstimateIdAndDeletedFalseOrderBySequenceAsc(estimate.getId());
            versionData = objectMapper.writeValueAsString(new VersionSnapshot(estimate, items));
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize estimate version data for estimate {}", estimate.getId(), e);
        }

        EstimateVersion version = EstimateVersion.builder()
                .estimateId(estimate.getId())
                .versionNumber(versionNumber)
                .parentVersionId(null)
                .versionData(versionData)
                .reason(reason)
                .comment(comment)
                .isCurrent(true)
                .build();

        estimateVersionRepository.save(version);
    }

    private Estimate getEstimateOrThrow(UUID id) {
        return estimateRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Смета не найдена: " + id));
    }

    private EstimateItem getEstimateItemOrThrow(UUID id) {
        return estimateItemRepository.findById(id)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Позиция сметы не найдена: " + id));
    }

    private record VersionSnapshot(Estimate estimate, List<EstimateItem> items) {
    }
}
