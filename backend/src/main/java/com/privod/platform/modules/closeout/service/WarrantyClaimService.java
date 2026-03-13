package com.privod.platform.modules.closeout.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.closeout.domain.WarrantyClaim;
import com.privod.platform.modules.closeout.domain.WarrantyClaimStatus;
import com.privod.platform.modules.closeout.repository.WarrantyClaimRepository;
import com.privod.platform.modules.closeout.web.dto.CreateWarrantyClaimRequest;
import com.privod.platform.modules.closeout.web.dto.UpdateWarrantyClaimRequest;
import com.privod.platform.modules.closeout.web.dto.WarrantyClaimResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class WarrantyClaimService {

    private final WarrantyClaimRepository warrantyRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<WarrantyClaimResponse> findAll(UUID projectId, WarrantyClaimStatus status,
                                                UUID handoverPackageId, Pageable pageable) {
        Specification<WarrantyClaim> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (handoverPackageId != null) {
                predicates.add(cb.equal(root.get("handoverPackageId"), handoverPackageId));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        return warrantyRepository.findAll(spec, pageable).map(WarrantyClaimResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public WarrantyClaimResponse findById(UUID id) {
        WarrantyClaim claim = getOrThrow(id);
        return WarrantyClaimResponse.fromEntity(claim);
    }

    @Transactional
    public WarrantyClaimResponse create(CreateWarrantyClaimRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        WarrantyClaim claim = WarrantyClaim.builder()
                .projectId(request.projectId())
                .organizationId(organizationId)
                .handoverPackageId(request.handoverPackageId())
                .claimNumber(request.claimNumber())
                .title(request.title())
                .description(request.description())
                .status(WarrantyClaimStatus.OPEN)
                .defectType(request.defectType())
                .location(request.location())
                .reportedById(request.reportedById())
                .reportedDate(request.reportedDate())
                .warrantyExpiryDate(request.warrantyExpiryDate())
                .assignedToId(request.assignedToId())
                .costOfRepair(request.costOfRepair())
                .attachmentIds(request.attachmentIds())
                .build();

        claim = warrantyRepository.save(claim);
        auditService.logCreate("WarrantyClaim", claim.getId());

        log.info("Гарантийная рекламация создана: {} ({})", claim.getTitle(), claim.getId());
        return WarrantyClaimResponse.fromEntity(claim);
    }

    @Transactional
    public WarrantyClaimResponse update(UUID id, UpdateWarrantyClaimRequest request) {
        WarrantyClaim claim = getOrThrow(id);

        if (request.claimNumber() != null) {
            claim.setClaimNumber(request.claimNumber());
        }
        if (request.title() != null) {
            claim.setTitle(request.title());
        }
        if (request.description() != null) {
            claim.setDescription(request.description());
        }
        if (request.status() != null) {
            WarrantyClaimStatus oldStatus = claim.getStatus();
            claim.setStatus(request.status());
            auditService.logStatusChange("WarrantyClaim", id, oldStatus.name(), request.status().name());
        }
        if (request.defectType() != null) {
            claim.setDefectType(request.defectType());
        }
        if (request.location() != null) {
            claim.setLocation(request.location());
        }
        if (request.assignedToId() != null) {
            claim.setAssignedToId(request.assignedToId());
        }
        if (request.resolvedDate() != null) {
            claim.setResolvedDate(request.resolvedDate());
        }
        if (request.resolutionDescription() != null) {
            claim.setResolutionDescription(request.resolutionDescription());
        }
        if (request.costOfRepair() != null) {
            claim.setCostOfRepair(request.costOfRepair());
        }
        if (request.attachmentIds() != null) {
            claim.setAttachmentIds(request.attachmentIds());
        }

        claim = warrantyRepository.save(claim);
        auditService.logUpdate("WarrantyClaim", id, "multiple", null, null);

        log.info("Гарантийная рекламация обновлена: {} ({})", claim.getTitle(), claim.getId());
        return WarrantyClaimResponse.fromEntity(claim);
    }

    @Transactional
    public void delete(UUID id) {
        WarrantyClaim claim = getOrThrow(id);
        claim.softDelete();
        warrantyRepository.save(claim);
        auditService.logDelete("WarrantyClaim", id);
        log.info("Гарантийная рекламация удалена: {} ({})", claim.getTitle(), id);
    }

    /**
     * P2-PRJ-3: Enforce valid status transitions.
     * OPEN → UNDER_REVIEW → APPROVED → IN_REPAIR → RESOLVED → CLOSED
     *                  ↘ REJECTED
     */
    @Transactional
    public WarrantyClaimResponse transition(UUID id, WarrantyClaimStatus targetStatus, String note) {
        WarrantyClaim claim = getOrThrow(id);
        WarrantyClaimStatus current = claim.getStatus();

        boolean allowed = switch (targetStatus) {
            case UNDER_REVIEW  -> current == WarrantyClaimStatus.OPEN;
            case APPROVED   -> current == WarrantyClaimStatus.UNDER_REVIEW;
            case REJECTED   -> current == WarrantyClaimStatus.UNDER_REVIEW;
            case IN_REPAIR  -> current == WarrantyClaimStatus.APPROVED;
            case RESOLVED   -> current == WarrantyClaimStatus.IN_REPAIR;
            case CLOSED     -> current == WarrantyClaimStatus.RESOLVED;
            default         -> false;
        };

        if (!allowed) {
            throw new IllegalStateException(
                    String.format("Недопустимый переход статуса: %s → %s", current.getDisplayName(), targetStatus.getDisplayName()));
        }

        claim.setStatus(targetStatus);
        if (targetStatus == WarrantyClaimStatus.RESOLVED || targetStatus == WarrantyClaimStatus.CLOSED) {
            if (claim.getResolvedDate() == null) {
                claim.setResolvedDate(java.time.LocalDate.now());
            }
        }
        if (note != null && !note.isBlank()) {
            claim.setResolutionDescription(note);
        }
        claim = warrantyRepository.save(claim);
        auditService.logStatusChange("WarrantyClaim", id, current.name(), targetStatus.name());
        log.info("Рекламация {} переведена: {} → {}", id, current, targetStatus);
        return WarrantyClaimResponse.fromEntity(claim);
    }

    private WarrantyClaim getOrThrow(UUID id) {
        return warrantyRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Гарантийная рекламация не найдена: " + id));
    }
}
