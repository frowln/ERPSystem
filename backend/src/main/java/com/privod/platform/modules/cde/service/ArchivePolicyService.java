package com.privod.platform.modules.cde.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.cde.domain.ArchivePolicy;
import com.privod.platform.modules.cde.domain.DocumentAuditEntry;
import com.privod.platform.modules.cde.domain.DocumentClassification;
import com.privod.platform.modules.cde.domain.DocumentContainer;
import com.privod.platform.modules.cde.domain.DocumentLifecycleState;
import com.privod.platform.modules.cde.repository.ArchivePolicyRepository;
import com.privod.platform.modules.cde.repository.DocumentAuditEntryRepository;
import com.privod.platform.modules.cde.repository.DocumentContainerRepository;
import com.privod.platform.modules.cde.web.dto.ArchivePolicyResponse;
import com.privod.platform.modules.cde.web.dto.CreateArchivePolicyRequest;
import com.privod.platform.modules.cde.web.dto.UpdateArchivePolicyRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ArchivePolicyService {

    private final ArchivePolicyRepository archivePolicyRepository;
    private final DocumentContainerRepository documentContainerRepository;
    private final DocumentAuditEntryRepository documentAuditEntryRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ArchivePolicyResponse> findAll(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return archivePolicyRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(ArchivePolicyResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ArchivePolicyResponse findById(UUID id) {
        ArchivePolicy policy = getPolicyOrThrow(id);
        return ArchivePolicyResponse.fromEntity(policy);
    }

    @Transactional
    public ArchivePolicyResponse create(CreateArchivePolicyRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        ArchivePolicy policy = ArchivePolicy.builder()
                .organizationId(orgId)
                .name(request.name())
                .description(request.description())
                .classification(request.classification())
                .retentionDays(request.retentionDays())
                .autoArchive(request.autoArchive())
                .enabled(request.enabled())
                .build();

        policy = archivePolicyRepository.save(policy);
        auditService.logCreate("ArchivePolicy", policy.getId());

        log.info("ArchivePolicy created: {} ({})", policy.getName(), policy.getId());
        return ArchivePolicyResponse.fromEntity(policy);
    }

    @Transactional
    public ArchivePolicyResponse update(UUID id, UpdateArchivePolicyRequest request) {
        ArchivePolicy policy = getPolicyOrThrow(id);

        if (request.name() != null) {
            policy.setName(request.name());
        }
        if (request.description() != null) {
            policy.setDescription(request.description());
        }
        if (request.classification() != null) {
            policy.setClassification(request.classification());
        }
        if (request.retentionDays() != null) {
            policy.setRetentionDays(request.retentionDays());
        }
        if (request.autoArchive() != null) {
            policy.setAutoArchive(request.autoArchive());
        }
        if (request.enabled() != null) {
            policy.setEnabled(request.enabled());
        }

        policy = archivePolicyRepository.save(policy);
        auditService.logUpdate("ArchivePolicy", policy.getId(), "multiple", null, null);

        log.info("ArchivePolicy updated: {} ({})", policy.getName(), policy.getId());
        return ArchivePolicyResponse.fromEntity(policy);
    }

    @Transactional
    public void delete(UUID id) {
        ArchivePolicy policy = getPolicyOrThrow(id);
        policy.softDelete();
        archivePolicyRepository.save(policy);
        auditService.logDelete("ArchivePolicy", id);

        log.info("ArchivePolicy soft-deleted: {} ({})", policy.getName(), id);
    }

    @Transactional
    public int autoArchiveExpiredDocuments() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<ArchivePolicy> policies = archivePolicyRepository
                .findByOrganizationIdAndEnabledTrueAndDeletedFalse(orgId);

        int totalArchived = 0;

        for (ArchivePolicy policy : policies) {
            if (!policy.isAutoArchive()) {
                continue;
            }

            Instant cutoff = Instant.now().minus(policy.getRetentionDays(), ChronoUnit.DAYS);

            Specification<DocumentContainer> spec = (root, query, cb) -> {
                var predicates = cb.and(
                        cb.equal(root.get("organizationId"), orgId),
                        cb.equal(root.get("lifecycleState"), DocumentLifecycleState.PUBLISHED),
                        cb.equal(root.get("deleted"), false),
                        cb.lessThan(root.get("updatedAt"), cutoff)
                );

                if (policy.getClassification() != null) {
                    predicates = cb.and(predicates,
                            cb.equal(root.get("classification"), policy.getClassification()));
                }

                return predicates;
            };

            List<DocumentContainer> expired = documentContainerRepository.findAll(spec);

            for (DocumentContainer container : expired) {
                DocumentLifecycleState oldState = container.getLifecycleState();
                container.setLifecycleState(DocumentLifecycleState.ARCHIVED);
                documentContainerRepository.save(container);

                auditService.logStatusChange("DocumentContainer", container.getId(),
                        oldState.name(), DocumentLifecycleState.ARCHIVED.name());

                DocumentAuditEntry auditEntry = DocumentAuditEntry.builder()
                        .documentContainerId(container.getId())
                        .action("AUTO_ARCHIVED")
                        .performedAt(Instant.now())
                        .previousState(oldState.name())
                        .newState(DocumentLifecycleState.ARCHIVED.name())
                        .details("{\"policyId\":\"" + policy.getId() +
                                "\",\"policyName\":\"" + policy.getName() +
                                "\",\"retentionDays\":" + policy.getRetentionDays() + "}")
                        .build();
                documentAuditEntryRepository.save(auditEntry);

                totalArchived++;
            }

            if (!expired.isEmpty()) {
                log.info("Policy '{}' archived {} documents (classification={}, retentionDays={})",
                        policy.getName(), expired.size(),
                        policy.getClassification(), policy.getRetentionDays());
            }
        }

        return totalArchived;
    }

    private ArchivePolicy getPolicyOrThrow(UUID id) {
        return archivePolicyRepository.findById(id)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Политика архивирования не найдена с id: " + id));
    }
}
