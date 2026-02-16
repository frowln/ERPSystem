package com.privod.platform.modules.cde.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.cde.domain.DocumentAuditEntry;
import com.privod.platform.modules.cde.domain.DocumentContainer;
import com.privod.platform.modules.cde.domain.DocumentLifecycleState;
import com.privod.platform.modules.cde.domain.DocumentRevision;
import com.privod.platform.modules.cde.domain.RevisionStatus;
import com.privod.platform.modules.cde.repository.DocumentAuditEntryRepository;
import com.privod.platform.modules.cde.repository.DocumentContainerRepository;
import com.privod.platform.modules.cde.repository.DocumentRevisionRepository;
import com.privod.platform.modules.cde.web.dto.ChangeLifecycleStateRequest;
import com.privod.platform.modules.cde.web.dto.CreateDocumentContainerRequest;
import com.privod.platform.modules.cde.web.dto.CreateRevisionRequest;
import com.privod.platform.modules.cde.web.dto.DocumentContainerResponse;
import com.privod.platform.modules.cde.web.dto.DocumentRevisionResponse;
import com.privod.platform.modules.cde.web.dto.UpdateDocumentContainerRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentContainerService {

    private final DocumentContainerRepository documentContainerRepository;
    private final DocumentRevisionRepository documentRevisionRepository;
    private final DocumentAuditEntryRepository documentAuditEntryRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<DocumentContainerResponse> findAll(String search, DocumentLifecycleState state,
                                                    Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return documentContainerRepository.searchByTitleOrNumberGlobal(search, pageable)
                    .map(DocumentContainerResponse::fromEntity);
        }
        if (state != null) {
            return documentContainerRepository.findByLifecycleStateAndDeletedFalse(state, pageable)
                    .map(DocumentContainerResponse::fromEntity);
        }
        return documentContainerRepository.findByDeletedFalse(pageable)
                .map(DocumentContainerResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<DocumentContainerResponse> findByProject(UUID projectId, String search,
                                                          DocumentLifecycleState state,
                                                          Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return documentContainerRepository.searchByTitleOrNumber(projectId, search, pageable)
                    .map(DocumentContainerResponse::fromEntity);
        }
        if (state != null) {
            return documentContainerRepository.findByProjectIdAndLifecycleStateAndDeletedFalse(projectId, state, pageable)
                    .map(DocumentContainerResponse::fromEntity);
        }
        return documentContainerRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(DocumentContainerResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public DocumentContainerResponse findById(UUID id) {
        DocumentContainer container = getContainerOrThrow(id);
        return DocumentContainerResponse.fromEntity(container);
    }

    @Transactional
    public DocumentContainerResponse create(CreateDocumentContainerRequest request) {
        documentContainerRepository.findByProjectIdAndDocumentNumberAndDeletedFalse(
                request.projectId(), request.documentNumber()
        ).ifPresent(existing -> {
            throw new IllegalArgumentException(
                    "Документ с номером '" + request.documentNumber() + "' уже существует в проекте");
        });

        DocumentContainer container = DocumentContainer.builder()
                .projectId(request.projectId())
                .documentNumber(request.documentNumber())
                .title(request.title())
                .description(request.description())
                .classification(request.classification())
                .lifecycleState(DocumentLifecycleState.WIP)
                .discipline(request.discipline())
                .zone(request.zone())
                .level(request.level())
                .originatorCode(request.originatorCode())
                .typeCode(request.typeCode())
                .metadata(request.metadata())
                .tags(request.tags())
                .build();

        container = documentContainerRepository.save(container);
        auditService.logCreate("DocumentContainer", container.getId());

        createAuditEntry(container.getId(), "CREATED", null, DocumentLifecycleState.WIP.name(), null);

        log.info("DocumentContainer created: {} - {} ({})", container.getDocumentNumber(),
                container.getTitle(), container.getId());
        return DocumentContainerResponse.fromEntity(container);
    }

    @Transactional
    public DocumentContainerResponse update(UUID id, UpdateDocumentContainerRequest request) {
        DocumentContainer container = getContainerOrThrow(id);

        if (request.title() != null) {
            container.setTitle(request.title());
        }
        if (request.description() != null) {
            container.setDescription(request.description());
        }
        if (request.classification() != null) {
            container.setClassification(request.classification());
        }
        if (request.discipline() != null) {
            container.setDiscipline(request.discipline());
        }
        if (request.zone() != null) {
            container.setZone(request.zone());
        }
        if (request.level() != null) {
            container.setLevel(request.level());
        }
        if (request.originatorCode() != null) {
            container.setOriginatorCode(request.originatorCode());
        }
        if (request.typeCode() != null) {
            container.setTypeCode(request.typeCode());
        }
        if (request.metadata() != null) {
            container.setMetadata(request.metadata());
        }
        if (request.tags() != null) {
            container.setTags(request.tags());
        }

        container = documentContainerRepository.save(container);
        auditService.logUpdate("DocumentContainer", container.getId(), "multiple", null, null);

        log.info("DocumentContainer updated: {} ({})", container.getDocumentNumber(), container.getId());
        return DocumentContainerResponse.fromEntity(container);
    }

    @Transactional
    public DocumentContainerResponse changeLifecycleState(UUID id, ChangeLifecycleStateRequest request) {
        DocumentContainer container = getContainerOrThrow(id);
        DocumentLifecycleState oldState = container.getLifecycleState();
        DocumentLifecycleState newState = request.newState();

        if (!container.canTransitionTo(newState)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести документ из состояния '%s' в '%s'. " +
                                    "ISO 19650 допускает только: В работе -> Общий доступ -> Опубликован -> Архив",
                            oldState.getDisplayName(), newState.getDisplayName()));
        }

        container.setLifecycleState(newState);
        container = documentContainerRepository.save(container);

        auditService.logStatusChange("DocumentContainer", container.getId(), oldState.name(), newState.name());
        createAuditEntry(container.getId(), "STATE_CHANGE", oldState.name(), newState.name(), null);

        log.info("DocumentContainer state changed: {} from {} to {} ({})",
                container.getDocumentNumber(), oldState, newState, container.getId());
        return DocumentContainerResponse.fromEntity(container);
    }

    @Transactional
    public DocumentRevisionResponse addRevision(UUID containerId, CreateRevisionRequest request) {
        DocumentContainer container = getContainerOrThrow(containerId);

        // Supersede old current revision
        List<DocumentRevision> currentRevisions = documentRevisionRepository
                .findByDocumentContainerIdAndRevisionStatusAndDeletedFalse(containerId, RevisionStatus.CURRENT);

        DocumentRevision newRevision = DocumentRevision.builder()
                .documentContainerId(containerId)
                .revisionNumber(request.revisionNumber())
                .revisionStatus(RevisionStatus.CURRENT)
                .description(request.description())
                .fileId(request.fileId())
                .fileName(request.fileName())
                .fileSize(request.fileSize())
                .mimeType(request.mimeType())
                .uploadedAt(Instant.now())
                .build();

        newRevision = documentRevisionRepository.save(newRevision);

        // Mark old current revisions as superseded
        for (DocumentRevision oldRevision : currentRevisions) {
            oldRevision.setRevisionStatus(RevisionStatus.SUPERSEDED);
            oldRevision.setSupersededById(newRevision.getId());
            oldRevision.setSupersededAt(Instant.now());
            documentRevisionRepository.save(oldRevision);
        }

        // Update container's current revision pointer
        container.setCurrentRevisionId(newRevision.getId());
        documentContainerRepository.save(container);

        auditService.logCreate("DocumentRevision", newRevision.getId());
        createAuditEntry(containerId, "REVISION_ADDED", null, null,
                "{\"revisionNumber\":\"" + request.revisionNumber() + "\",\"revisionId\":\"" + newRevision.getId() + "\"}");

        log.info("Revision {} added to document {} ({})", request.revisionNumber(),
                container.getDocumentNumber(), containerId);
        return DocumentRevisionResponse.fromEntity(newRevision);
    }

    @Transactional(readOnly = true)
    public List<DocumentRevisionResponse> getRevisions(UUID containerId) {
        getContainerOrThrow(containerId);
        return documentRevisionRepository.findByDocumentContainerIdAndDeletedFalseOrderByCreatedAtDesc(containerId)
                .stream()
                .map(DocumentRevisionResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void delete(UUID id) {
        DocumentContainer container = getContainerOrThrow(id);
        container.softDelete();
        documentContainerRepository.save(container);
        auditService.logDelete("DocumentContainer", id);

        createAuditEntry(id, "DELETED", container.getLifecycleState().name(), null, null);

        log.info("DocumentContainer soft-deleted: {} ({})", container.getDocumentNumber(), id);
    }

    private DocumentContainer getContainerOrThrow(UUID id) {
        return documentContainerRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Контейнер документа не найден с id: " + id));
    }

    private void createAuditEntry(UUID containerId, String action, String previousState,
                                   String newState, String details) {
        DocumentAuditEntry entry = DocumentAuditEntry.builder()
                .documentContainerId(containerId)
                .action(action)
                .performedAt(Instant.now())
                .previousState(previousState)
                .newState(newState)
                .details(details)
                .build();
        documentAuditEntryRepository.save(entry);
    }
}
