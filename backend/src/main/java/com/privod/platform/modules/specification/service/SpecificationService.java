package com.privod.platform.modules.specification.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.specification.domain.SpecItem;
import com.privod.platform.modules.specification.domain.SpecItemType;
import com.privod.platform.modules.specification.domain.Specification;
import com.privod.platform.modules.specification.domain.SpecificationStatus;
import com.privod.platform.modules.specification.repository.SpecItemRepository;
import com.privod.platform.modules.specification.repository.SpecificationRepository;
import com.privod.platform.modules.specification.web.dto.ChangeSpecStatusRequest;
import com.privod.platform.modules.specification.web.dto.CreateSpecItemRequest;
import com.privod.platform.modules.specification.web.dto.CreateSpecificationRequest;
import com.privod.platform.modules.specification.web.dto.SpecItemResponse;
import com.privod.platform.modules.specification.web.dto.SpecificationListResponse;
import com.privod.platform.modules.specification.web.dto.SpecificationResponse;
import com.privod.platform.modules.specification.web.dto.SpecificationSummaryResponse;
import com.privod.platform.modules.specification.web.dto.UpdateSpecItemRequest;
import com.privod.platform.modules.specification.web.dto.UpdateSpecificationRequest;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SpecificationService {

    private final SpecificationRepository specificationRepository;
    private final SpecItemRepository specItemRepository;
    private final ProjectRepository projectRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<SpecificationListResponse> listSpecifications(UUID projectId, SpecificationStatus status, Pageable pageable) {
        org.springframework.data.jpa.domain.Specification<Specification> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        return specificationRepository.findAll(spec, pageable).map(s -> {
            long cnt = specItemRepository.countBySpecificationIdAndDeletedFalse(s.getId());
            return SpecificationListResponse.fromEntity(s, cnt);
        });
    }

    @Transactional(readOnly = true)
    public SpecificationResponse getSpecification(UUID id) {
        Specification specification = getSpecificationOrThrow(id);
        List<SpecItemResponse> items = specItemRepository
                .findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(id)
                .stream()
                .map(SpecItemResponse::fromEntity)
                .toList();
        return SpecificationResponse.fromEntity(specification, items);
    }

    @Transactional
    public SpecificationResponse createSpecification(CreateSpecificationRequest request) {
        String name = generateSpecName();
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        SpecificationStatus initialStatus = request.status() != null ? request.status() : SpecificationStatus.DRAFT;
        // Resolve project name from the project entity if not supplied by the caller
        String resolvedProjectName = request.projectName();
        if ((resolvedProjectName == null || resolvedProjectName.isBlank()) && request.projectId() != null) {
            resolvedProjectName = projectRepository.findById(request.projectId())
                    .map(p -> p.getName())
                    .orElse(null);
        }
        Specification specification = Specification.builder()
                .organizationId(organizationId)
                .name(name)
                .title(request.title() != null && !request.title().isBlank() ? request.title() : name)
                .projectId(request.projectId())
                .projectName(resolvedProjectName)
                .contractId(request.contractId())
                .docVersion(1)
                .isCurrent(true)
                .status(initialStatus)
                .notes(request.notes())
                .build();

        specification = specificationRepository.save(specification);
        auditService.logCreate("Specification", specification.getId());

        log.info("Specification created: {} for project {} ({})", specification.getName(), request.projectId(), specification.getId());
        return SpecificationResponse.fromEntity(specification);
    }

    @Transactional
    public SpecificationResponse updateSpecification(UUID id, UpdateSpecificationRequest request) {
        Specification specification = getSpecificationOrThrow(id);

        if (request.title() != null) {
            specification.setTitle(request.title().isBlank() ? null : request.title());
        }
        if (request.projectName() != null) {
            specification.setProjectName(request.projectName());
        }
        if (request.contractId() != null) {
            specification.setContractId(request.contractId());
        }
        if (request.status() != null && specification.canTransitionTo(request.status())) {
            specification.setStatus(request.status());
        }
        if (request.notes() != null) {
            specification.setNotes(request.notes());
        }

        specification = specificationRepository.save(specification);
        auditService.logUpdate("Specification", specification.getId(), "multiple", null, null);

        log.info("Specification updated: {} ({})", specification.getName(), specification.getId());
        return SpecificationResponse.fromEntity(specification);
    }

    @Transactional
    public SpecificationResponse changeStatus(UUID id, ChangeSpecStatusRequest request) {
        Specification specification = getSpecificationOrThrow(id);
        SpecificationStatus oldStatus = specification.getStatus();
        SpecificationStatus newStatus = request.status();

        if (!specification.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести спецификацию из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        specification.setStatus(newStatus);
        specification = specificationRepository.save(specification);
        auditService.logStatusChange("Specification", specification.getId(), oldStatus.name(), newStatus.name());

        log.info("Specification status changed: {} from {} to {} ({})",
                specification.getName(), oldStatus, newStatus, specification.getId());
        return SpecificationResponse.fromEntity(specification);
    }

    @Transactional
    public SpecificationResponse submitForReview(UUID id) {
        Specification specification = getSpecificationOrThrow(id);
        if (!specification.canTransitionTo(SpecificationStatus.IN_REVIEW)) {
            throw new IllegalStateException("Спецификация не может быть отправлена на проверку из текущего статуса");
        }

        SpecificationStatus oldStatus = specification.getStatus();
        specification.setStatus(SpecificationStatus.IN_REVIEW);
        specification = specificationRepository.save(specification);
        auditService.logStatusChange("Specification", specification.getId(), oldStatus.name(), SpecificationStatus.IN_REVIEW.name());

        log.info("Specification submitted for review: {} ({})", specification.getName(), specification.getId());
        return SpecificationResponse.fromEntity(specification);
    }

    @Transactional
    public SpecificationResponse approveSpecification(UUID id) {
        Specification specification = getSpecificationOrThrow(id);
        if (!specification.canTransitionTo(SpecificationStatus.APPROVED)) {
            throw new IllegalStateException("Спецификация не может быть утверждена из текущего статуса");
        }

        SpecificationStatus oldStatus = specification.getStatus();

        // Unmark previous current specifications for this project
        List<Specification> currentSpecs = specificationRepository
                .findByProjectIdAndIsCurrentTrueAndDeletedFalse(specification.getProjectId());
        for (Specification current : currentSpecs) {
            if (!current.getId().equals(id)) {
                current.setCurrent(false);
                specificationRepository.save(current);
            }
        }

        specification.setStatus(SpecificationStatus.APPROVED);
        specification.setCurrent(true);
        specification = specificationRepository.save(specification);
        auditService.logStatusChange("Specification", specification.getId(), oldStatus.name(), SpecificationStatus.APPROVED.name());

        log.info("Specification approved: {} ({})", specification.getName(), specification.getId());
        return SpecificationResponse.fromEntity(specification);
    }

    @Transactional
    public SpecificationResponse activateSpecification(UUID id) {
        Specification specification = getSpecificationOrThrow(id);
        if (!specification.canTransitionTo(SpecificationStatus.ACTIVE)) {
            throw new IllegalStateException("Спецификация не может быть активирована из текущего статуса");
        }

        SpecificationStatus oldStatus = specification.getStatus();
        specification.setStatus(SpecificationStatus.ACTIVE);
        specification = specificationRepository.save(specification);
        auditService.logStatusChange("Specification", specification.getId(), oldStatus.name(), SpecificationStatus.ACTIVE.name());

        log.info("Specification activated: {} ({})", specification.getName(), specification.getId());
        return SpecificationResponse.fromEntity(specification);
    }

    @Transactional
    public SpecificationResponse createVersion(UUID id) {
        Specification original = getSpecificationOrThrow(id);

        // Mark original as not current
        original.setCurrent(false);
        specificationRepository.save(original);

        // Create new version — copy all metadata from original
        String name = generateSpecName();
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Specification newVersion = Specification.builder()
                .organizationId(organizationId)
                .name(name)
                .title(original.getTitle())
                .projectId(original.getProjectId())
                .projectName(original.getProjectName())
                .contractId(original.getContractId())
                .docVersion(original.getDocVersion() + 1)
                .isCurrent(true)
                .status(SpecificationStatus.DRAFT)
                .parentVersionId(original.getId())
                .notes(original.getNotes())
                .build();
        newVersion = specificationRepository.save(newVersion);

        // Copy items
        List<SpecItem> originalItems = specItemRepository
                .findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(id);
        for (SpecItem item : originalItems) {
            SpecItem copy = SpecItem.builder()
                    .specificationId(newVersion.getId())
                    .sequence(item.getSequence())
                    .position(item.getPosition())
                    .sectionName(item.getSectionName())
                    .itemType(item.getItemType())
                    .name(item.getName())
                    .brand(item.getBrand())
                    .productCode(item.getProductCode())
                    .manufacturer(item.getManufacturer())
                    .quantity(item.getQuantity())
                    .unitOfMeasure(item.getUnitOfMeasure())
                    .weight(item.getWeight())
                    .plannedAmount(item.getPlannedAmount())
                    .notes(item.getNotes())
                    .procurementStatus("not_started")
                    .estimateStatus("not_started")
                    .isCustomerProvided(item.isCustomerProvided())
                    .build();
            specItemRepository.save(copy);
        }

        auditService.logCreate("Specification", newVersion.getId());
        log.info("Specification version created: {} (v{}) from {} ({})",
                newVersion.getName(), newVersion.getDocVersion(), original.getName(), newVersion.getId());

        List<SpecItemResponse> items = specItemRepository
                .findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(newVersion.getId())
                .stream()
                .map(SpecItemResponse::fromEntity)
                .toList();
        return SpecificationResponse.fromEntity(newVersion, items);
    }

    @Transactional
    public SpecItemResponse addItem(UUID specId, CreateSpecItemRequest request) {
        Specification specification = getSpecificationOrThrow(specId);

        int sequence = request.sequence() != null ? request.sequence()
                : (int) specItemRepository.countBySpecificationIdAndDeletedFalse(specId) + 1;

        SpecItem item = SpecItem.builder()
                .specificationId(specId)
                .sequence(sequence)
                .position(request.position())
                .sectionName(request.sectionName())
                .itemType(request.itemType())
                .name(request.name())
                .brand(request.brand())
                .productCode(request.productCode())
                .manufacturer(request.manufacturer())
                .quantity(request.quantity())
                .unitOfMeasure(request.unitOfMeasure())
                .weight(request.weight())
                .plannedAmount(request.plannedAmount())
                .notes(request.notes())
                .isCustomerProvided(request.isCustomerProvided() != null ? request.isCustomerProvided() : false)
                .build();

        item = specItemRepository.save(item);
        auditService.logCreate("SpecItem", item.getId());

        log.info("Spec item added to specification {}: {} ({})", specId, item.getName(), item.getId());
        return SpecItemResponse.fromEntity(item);
    }

    @Transactional
    public SpecItemResponse updateItem(UUID itemId, UpdateSpecItemRequest request) {
        SpecItem item = getSpecItemOrThrow(itemId);

        if (request.itemType() != null) {
            item.setItemType(request.itemType());
        }
        if (request.name() != null) {
            item.setName(request.name());
        }
        if (request.brand() != null) {
            item.setBrand(request.brand());
        }
        if (request.productCode() != null) {
            item.setProductCode(request.productCode());
        }
        if (request.manufacturer() != null) {
            item.setManufacturer(request.manufacturer());
        }
        if (request.quantity() != null) {
            item.setQuantity(request.quantity());
        }
        if (request.unitOfMeasure() != null) {
            item.setUnitOfMeasure(request.unitOfMeasure());
        }
        if (request.weight() != null) {
            item.setWeight(request.weight());
        }
        if (request.plannedAmount() != null) {
            item.setPlannedAmount(request.plannedAmount());
        }
        if (request.notes() != null) {
            item.setNotes(request.notes());
        }
        if (request.sequence() != null) {
            item.setSequence(request.sequence());
        }
        if (request.procurementStatus() != null) {
            item.setProcurementStatus(request.procurementStatus());
        }
        if (request.estimateStatus() != null) {
            item.setEstimateStatus(request.estimateStatus());
        }
        if (request.isCustomerProvided() != null) {
            item.setCustomerProvided(request.isCustomerProvided());
        }
        if (request.budgetItemId() != null) {
            item.setBudgetItemId(request.budgetItemId());
        }
        if (request.position() != null) {
            item.setPosition(request.position());
        }
        if (request.sectionName() != null) {
            item.setSectionName(request.sectionName());
        }

        item = specItemRepository.save(item);
        auditService.logUpdate("SpecItem", item.getId(), "multiple", null, null);

        log.info("Spec item updated: {} ({})", item.getName(), item.getId());
        return SpecItemResponse.fromEntity(item);
    }

    @Transactional
    public void deleteSpecification(UUID id) {
        Specification specification = getSpecificationOrThrow(id);
        specification.softDelete();
        specificationRepository.save(specification);
        // Soft-delete all items too
        specItemRepository.findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(id)
                .forEach(item -> { item.softDelete(); specItemRepository.save(item); });
        auditService.logDelete("Specification", id);
        log.info("Specification deleted: {} ({})", specification.getName(), id);
    }

    @Transactional
    public void removeItem(UUID itemId) {
        SpecItem item = getSpecItemOrThrow(itemId);
        item.softDelete();
        specItemRepository.save(item);
        auditService.logDelete("SpecItem", itemId);
        log.info("Spec item removed: {} ({})", item.getName(), itemId);
    }

    @Transactional(readOnly = true)
    public List<SpecItemResponse> getItems(UUID specId) {
        getSpecificationOrThrow(specId);
        return specItemRepository.findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(specId)
                .stream()
                .map(SpecItemResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public SpecificationSummaryResponse getItemsSummary(UUID specId) {
        getSpecificationOrThrow(specId);

        List<SpecItem> items = specItemRepository.findBySpecificationIdAndDeletedFalseOrderBySequenceAsc(specId);

        long materialCount = 0;
        long equipmentCount = 0;
        long workCount = 0;
        BigDecimal materialPlanned = BigDecimal.ZERO;
        BigDecimal equipmentPlanned = BigDecimal.ZERO;
        BigDecimal workPlanned = BigDecimal.ZERO;

        for (SpecItem item : items) {
            BigDecimal amount = item.getPlannedAmount() != null ? item.getPlannedAmount() : BigDecimal.ZERO;
            switch (item.getItemType()) {
                case MATERIAL -> {
                    materialCount++;
                    materialPlanned = materialPlanned.add(amount);
                }
                case EQUIPMENT -> {
                    equipmentCount++;
                    equipmentPlanned = equipmentPlanned.add(amount);
                }
                case WORK -> {
                    workCount++;
                    workPlanned = workPlanned.add(amount);
                }
            }
        }

        BigDecimal totalPlanned = materialPlanned.add(equipmentPlanned).add(workPlanned);

        return new SpecificationSummaryResponse(
                items.size(),
                materialCount,
                equipmentCount,
                workCount,
                totalPlanned,
                materialPlanned,
                equipmentPlanned,
                workPlanned
        );
    }

    // === Supply Status ===

    @Transactional(readOnly = true)
    public SpecificationSummaryResponse getSupplySummary(UUID specId) {
        return getItemsSummary(specId);
    }

    @Transactional
    public void recalculateSupplyStatus(UUID specId) {
        // Method kept for compatibility but does nothing now that supply fields are decoupled from SpecItem
        log.info("Supply status calculation is now handled by the procurement module.");
    }

    private Specification getSpecificationOrThrow(UUID id) {
        return specificationRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Спецификация не найдена: " + id));
    }

    private SpecItem getSpecItemOrThrow(UUID id) {
        return specItemRepository.findById(id)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Позиция спецификации не найдена: " + id));
    }

    private String generateSpecName() {
        long seq = specificationRepository.getNextNameSequence();
        return String.format("SPEC-%05d", seq);
    }
}
