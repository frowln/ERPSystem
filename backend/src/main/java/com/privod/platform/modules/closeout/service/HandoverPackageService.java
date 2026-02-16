package com.privod.platform.modules.closeout.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.closeout.domain.HandoverPackage;
import com.privod.platform.modules.closeout.domain.HandoverStatus;
import com.privod.platform.modules.closeout.repository.HandoverPackageRepository;
import com.privod.platform.modules.closeout.web.dto.CreateHandoverPackageRequest;
import com.privod.platform.modules.closeout.web.dto.HandoverPackageResponse;
import com.privod.platform.modules.closeout.web.dto.UpdateHandoverPackageRequest;
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
public class HandoverPackageService {

    private final HandoverPackageRepository handoverRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<HandoverPackageResponse> findAll(UUID projectId, HandoverStatus status, Pageable pageable) {
        Specification<HandoverPackage> spec = (root, query, cb) -> {
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

        return handoverRepository.findAll(spec, pageable).map(HandoverPackageResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public HandoverPackageResponse findById(UUID id) {
        HandoverPackage pkg = getOrThrow(id);
        return HandoverPackageResponse.fromEntity(pkg);
    }

    @Transactional
    public HandoverPackageResponse create(CreateHandoverPackageRequest request) {
        HandoverPackage pkg = HandoverPackage.builder()
                .projectId(request.projectId())
                .packageNumber(request.packageNumber())
                .title(request.title())
                .description(request.description())
                .status(HandoverStatus.DRAFT)
                .recipientOrganization(request.recipientOrganization())
                .recipientContactId(request.recipientContactId())
                .preparedById(request.preparedById())
                .preparedDate(request.preparedDate())
                .handoverDate(request.handoverDate())
                .documentIds(request.documentIds())
                .drawingIds(request.drawingIds())
                .certificateIds(request.certificateIds())
                .manualIds(request.manualIds())
                .build();

        pkg = handoverRepository.save(pkg);
        auditService.logCreate("HandoverPackage", pkg.getId());

        log.info("Пакет передачи создан: {} ({})", pkg.getTitle(), pkg.getId());
        return HandoverPackageResponse.fromEntity(pkg);
    }

    @Transactional
    public HandoverPackageResponse update(UUID id, UpdateHandoverPackageRequest request) {
        HandoverPackage pkg = getOrThrow(id);

        if (request.packageNumber() != null) {
            pkg.setPackageNumber(request.packageNumber());
        }
        if (request.title() != null) {
            pkg.setTitle(request.title());
        }
        if (request.description() != null) {
            pkg.setDescription(request.description());
        }
        if (request.status() != null) {
            HandoverStatus oldStatus = pkg.getStatus();
            pkg.setStatus(request.status());
            auditService.logStatusChange("HandoverPackage", id, oldStatus.name(), request.status().name());
        }
        if (request.recipientOrganization() != null) {
            pkg.setRecipientOrganization(request.recipientOrganization());
        }
        if (request.recipientContactId() != null) {
            pkg.setRecipientContactId(request.recipientContactId());
        }
        if (request.preparedById() != null) {
            pkg.setPreparedById(request.preparedById());
        }
        if (request.preparedDate() != null) {
            pkg.setPreparedDate(request.preparedDate());
        }
        if (request.handoverDate() != null) {
            pkg.setHandoverDate(request.handoverDate());
        }
        if (request.acceptedDate() != null) {
            pkg.setAcceptedDate(request.acceptedDate());
        }
        if (request.acceptedById() != null) {
            pkg.setAcceptedById(request.acceptedById());
        }
        if (request.documentIds() != null) {
            pkg.setDocumentIds(request.documentIds());
        }
        if (request.drawingIds() != null) {
            pkg.setDrawingIds(request.drawingIds());
        }
        if (request.certificateIds() != null) {
            pkg.setCertificateIds(request.certificateIds());
        }
        if (request.manualIds() != null) {
            pkg.setManualIds(request.manualIds());
        }
        if (request.rejectionReason() != null) {
            pkg.setRejectionReason(request.rejectionReason());
        }

        pkg = handoverRepository.save(pkg);
        auditService.logUpdate("HandoverPackage", id, "multiple", null, null);

        log.info("Пакет передачи обновлён: {} ({})", pkg.getTitle(), pkg.getId());
        return HandoverPackageResponse.fromEntity(pkg);
    }

    @Transactional
    public void delete(UUID id) {
        HandoverPackage pkg = getOrThrow(id);
        pkg.softDelete();
        handoverRepository.save(pkg);
        auditService.logDelete("HandoverPackage", id);
        log.info("Пакет передачи удалён: {} ({})", pkg.getTitle(), id);
    }

    private HandoverPackage getOrThrow(UUID id) {
        return handoverRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Пакет передачи не найден: " + id));
    }
}
