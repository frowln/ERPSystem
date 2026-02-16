package com.privod.platform.modules.pto.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.pto.domain.PtoDocument;
import com.privod.platform.modules.pto.domain.PtoDocumentStatus;
import com.privod.platform.modules.pto.domain.PtoDocumentVersion;
import com.privod.platform.modules.pto.repository.PtoDocumentRepository;
import com.privod.platform.modules.pto.repository.PtoDocumentVersionRepository;
import com.privod.platform.modules.pto.web.dto.ChangePtoStatusRequest;
import com.privod.platform.modules.pto.web.dto.CreatePtoDocumentRequest;
import com.privod.platform.modules.pto.web.dto.PtoDocumentResponse;
import com.privod.platform.modules.pto.web.dto.UpdatePtoDocumentRequest;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PtoDocumentService {

    private final PtoDocumentRepository documentRepository;
    private final PtoDocumentVersionRepository versionRepository;
    private final PtoCodeGenerator codeGenerator;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<PtoDocumentResponse> listDocuments(UUID projectId, PtoDocumentStatus status, Pageable pageable) {
        Specification<PtoDocument> spec = (root, query, cb) -> {
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
        return documentRepository.findAll(spec, pageable).map(PtoDocumentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PtoDocumentResponse getDocument(UUID id) {
        PtoDocument document = getDocumentOrThrow(id);
        return PtoDocumentResponse.fromEntity(document);
    }

    @Transactional
    public PtoDocumentResponse createDocument(CreatePtoDocumentRequest request) {
        String code = codeGenerator.generateDocumentCode();

        PtoDocument document = PtoDocument.builder()
                .projectId(request.projectId())
                .code(code)
                .title(request.title())
                .documentType(request.documentType())
                .discipline(request.discipline())
                .status(PtoDocumentStatus.DRAFT)
                .currentVersion(1)
                .notes(request.notes())
                .build();

        document = documentRepository.save(document);
        auditService.logCreate("PtoDocument", document.getId());

        // Create initial version entry
        PtoDocumentVersion version = PtoDocumentVersion.builder()
                .documentId(document.getId())
                .versionNumber(1)
                .changeDescription("Первоначальное создание документа")
                .build();
        versionRepository.save(version);

        log.info("PTO document created: {} ({}) for project {}", document.getTitle(), document.getCode(), request.projectId());
        return PtoDocumentResponse.fromEntity(document);
    }

    @Transactional
    public PtoDocumentResponse updateDocument(UUID id, UpdatePtoDocumentRequest request) {
        PtoDocument document = getDocumentOrThrow(id);

        if (request.title() != null) {
            document.setTitle(request.title());
        }
        if (request.discipline() != null) {
            document.setDiscipline(request.discipline());
        }
        if (request.notes() != null) {
            document.setNotes(request.notes());
        }

        document = documentRepository.save(document);
        auditService.logUpdate("PtoDocument", document.getId(), "multiple", null, null);

        log.info("PTO document updated: {} ({})", document.getTitle(), document.getId());
        return PtoDocumentResponse.fromEntity(document);
    }

    @Transactional
    public PtoDocumentResponse changeStatus(UUID id, ChangePtoStatusRequest request) {
        PtoDocument document = getDocumentOrThrow(id);
        PtoDocumentStatus oldStatus = document.getStatus();
        PtoDocumentStatus newStatus = request.status();

        if (!document.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести документ из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        document.setStatus(newStatus);

        if (newStatus == PtoDocumentStatus.APPROVED) {
            document.setApprovedAt(Instant.now());
        }

        document = documentRepository.save(document);
        auditService.logStatusChange("PtoDocument", document.getId(), oldStatus.name(), newStatus.name());

        log.info("PTO document status changed: {} from {} to {} ({})",
                document.getTitle(), oldStatus, newStatus, document.getId());
        return PtoDocumentResponse.fromEntity(document);
    }

    @Transactional
    public void deleteDocument(UUID id) {
        PtoDocument document = getDocumentOrThrow(id);
        document.softDelete();
        documentRepository.save(document);
        auditService.logDelete("PtoDocument", id);
        log.info("PTO document deleted: {} ({})", document.getTitle(), id);
    }

    private PtoDocument getDocumentOrThrow(UUID id) {
        return documentRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("ПТО документ не найден: " + id));
    }
}
