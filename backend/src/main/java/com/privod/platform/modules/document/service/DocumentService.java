package com.privod.platform.modules.document.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.document.domain.Document;
import com.privod.platform.modules.document.domain.DocumentAccess;
import com.privod.platform.modules.document.domain.DocumentCategory;
import com.privod.platform.modules.document.domain.DocumentComment;
import com.privod.platform.modules.document.domain.DocumentStatus;
import com.privod.platform.modules.document.repository.DocumentAccessRepository;
import com.privod.platform.modules.document.repository.DocumentCommentRepository;
import com.privod.platform.modules.document.repository.DocumentRepository;
import com.privod.platform.modules.document.web.dto.AddDocumentCommentRequest;
import com.privod.platform.modules.document.web.dto.ChangeDocumentStatusRequest;
import com.privod.platform.modules.document.web.dto.CreateDocumentRequest;
import com.privod.platform.modules.document.web.dto.DocumentAccessResponse;
import com.privod.platform.modules.document.web.dto.DocumentCommentResponse;
import com.privod.platform.modules.document.web.dto.DocumentResponse;
import com.privod.platform.modules.document.web.dto.GrantAccessRequest;
import com.privod.platform.modules.document.web.dto.UpdateDocumentRequest;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final DocumentAccessRepository accessRepository;
    private final DocumentCommentRepository commentRepository;
    private final ProjectRepository projectRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<DocumentResponse> listDocuments(UUID projectId, DocumentCategory category,
                                                 DocumentStatus status, String search, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);

        Specification<Document> spec = Specification.where(DocumentSpecification.notDeleted())
                .and(DocumentSpecification.belongsToOrganization(organizationId))
                .and(DocumentSpecification.belongsToProject(projectId))
                .and(DocumentSpecification.hasCategory(category))
                .and(DocumentSpecification.hasStatus(status))
                .and(DocumentSpecification.searchByTitleOrDescription(search));

        return documentRepository.findAll(spec, pageable).map(DocumentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public DocumentResponse getDocument(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Document document = getDocumentOrThrow(id, organizationId);
        List<DocumentAccessResponse> accessList = accessRepository
                .findByDocumentIdAndDeletedFalse(id)
                .stream()
                .map(DocumentAccessResponse::fromEntity)
                .toList();
        return DocumentResponse.fromEntity(document, accessList);
    }

    @Transactional
    public DocumentResponse createDocument(CreateDocumentRequest request) {
        CustomUserDetails currentUser = requireCurrentUserDetails();
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        UUID resolvedProjectId = resolveProjectIdForContract(request.contractId(), request.projectId(), organizationId);

        Document document = Document.builder()
                .organizationId(organizationId)
                .title(request.title())
                .documentNumber(request.documentNumber())
                .category(request.category())
                .status(DocumentStatus.DRAFT)
                .projectId(resolvedProjectId)
                .contractId(request.contractId())
                .description(request.description())
                .fileName(request.fileName())
                .fileSize(request.fileSize())
                .mimeType(request.mimeType())
                .storagePath(request.storagePath())
                .authorId(currentUser.getId())
                .authorName(currentUser.getFullName())
                .tags(request.tags())
                .expiryDate(request.expiryDate())
                .notes(request.notes())
                .build();

        document = documentRepository.save(document);
        auditService.logCreate("Document", document.getId());

        log.info("Document created: {} ({})", document.getTitle(), document.getId());
        return DocumentResponse.fromEntity(document);
    }

    @Transactional
    public DocumentResponse updateDocument(UUID id, UpdateDocumentRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Document document = getDocumentOrThrow(id, organizationId);

        if (request.title() != null) {
            document.setTitle(request.title());
        }
        if (request.documentNumber() != null) {
            document.setDocumentNumber(request.documentNumber());
        }
        if (request.category() != null) {
            document.setCategory(request.category());
        }
        if (request.projectId() != null || request.contractId() != null) {
            UUID targetProjectId = request.projectId() != null ? request.projectId() : document.getProjectId();
            UUID targetContractId = request.contractId() != null ? request.contractId() : document.getContractId();

            UUID resolvedProjectId = resolveProjectIdForContract(targetContractId, targetProjectId, organizationId);

            // Keep document consistent: if contract exists and project was missing, we auto-derive it.
            document.setProjectId(resolvedProjectId);
            document.setContractId(targetContractId);
        }
        if (request.description() != null) {
            document.setDescription(request.description());
        }
        if (request.fileName() != null) {
            document.setFileName(request.fileName());
        }
        if (request.fileSize() != null) {
            document.setFileSize(request.fileSize());
        }
        if (request.mimeType() != null) {
            document.setMimeType(request.mimeType());
        }
        if (request.storagePath() != null) {
            document.setStoragePath(request.storagePath());
        }
        if (request.tags() != null) {
            document.setTags(request.tags());
        }
        if (request.expiryDate() != null) {
            document.setExpiryDate(request.expiryDate());
        }
        if (request.notes() != null) {
            document.setNotes(request.notes());
        }

        document = documentRepository.save(document);
        auditService.logUpdate("Document", document.getId(), "multiple", null, null);

        log.info("Document updated: {} ({})", document.getTitle(), document.getId());
        return DocumentResponse.fromEntity(document);
    }

    @Transactional
    public DocumentResponse changeStatus(UUID id, ChangeDocumentStatusRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Document document = getDocumentOrThrow(id, organizationId);
        DocumentStatus oldStatus = document.getStatus();
        DocumentStatus newStatus = request.status();

        if (!document.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести документ из статуса %s в %s",
                            oldStatus.getDisplayName(), newStatus.getDisplayName()));
        }

        document.setStatus(newStatus);

        document = documentRepository.save(document);
        auditService.logStatusChange("Document", document.getId(), oldStatus.name(), newStatus.name());

        log.info("Document status changed: {} from {} to {} ({})",
                document.getTitle(), oldStatus, newStatus, document.getId());
        return DocumentResponse.fromEntity(document);
    }

    @Transactional
    public DocumentResponse createVersion(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Document original = getDocumentOrThrow(id, organizationId);

        Document newVersion = Document.builder()
                .organizationId(organizationId)
                .title(original.getTitle())
                .documentNumber(original.getDocumentNumber())
                .category(original.getCategory())
                .status(DocumentStatus.DRAFT)
                .projectId(original.getProjectId())
                .contractId(original.getContractId())
                .description(original.getDescription())
                .fileName(original.getFileName())
                .fileSize(original.getFileSize())
                .mimeType(original.getMimeType())
                .storagePath(original.getStoragePath())
                .docVersion(original.getDocVersion() + 1)
                .parentVersionId(original.getId())
                .authorId(original.getAuthorId())
                .authorName(original.getAuthorName())
                .tags(original.getTags())
                .expiryDate(original.getExpiryDate())
                .notes(original.getNotes())
                .build();

        newVersion = documentRepository.save(newVersion);
        auditService.logCreate("Document", newVersion.getId());

        log.info("New version created for document {}: version {} ({})",
                original.getTitle(), newVersion.getDocVersion(), newVersion.getId());
        return DocumentResponse.fromEntity(newVersion);
    }

    @Transactional
    public DocumentCommentResponse addComment(UUID documentId, AddDocumentCommentRequest request) {
        CustomUserDetails currentUser = requireCurrentUserDetails();
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getDocumentOrThrow(documentId, organizationId);

        DocumentComment comment = DocumentComment.builder()
                .documentId(documentId)
                .authorId(currentUser.getId())
                .authorName(currentUser.getFullName())
                .content(request.content())
                .build();

        comment = commentRepository.save(comment);

        log.info("Comment added to document: {} ({})", documentId, comment.getId());
        return DocumentCommentResponse.fromEntity(comment);
    }

    @Transactional
    public DocumentAccessResponse grantAccess(UUID documentId, GrantAccessRequest request) {
        CustomUserDetails currentUser = requireCurrentUserDetails();
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getDocumentOrThrow(documentId, organizationId);
        validateUserTenant(request.userId(), organizationId);

        // Update existing access or create new
        DocumentAccess access = accessRepository
                .findByDocumentIdAndUserIdAndDeletedFalse(documentId, request.userId())
                .orElse(null);

        if (access != null) {
            access.setAccessLevel(request.accessLevel());
            access.setGrantedById(currentUser.getId());
            access.setGrantedByName(currentUser.getFullName());
        } else {
            access = DocumentAccess.builder()
                    .documentId(documentId)
                    .userId(request.userId())
                    .accessLevel(request.accessLevel())
                    .grantedById(currentUser.getId())
                    .grantedByName(currentUser.getFullName())
                    .build();
        }

        access = accessRepository.save(access);

        log.info("Access granted on document {} to user {} with level {} ({})",
                documentId, request.userId(), request.accessLevel(), access.getId());
        return DocumentAccessResponse.fromEntity(access);
    }

    @Transactional
    public void revokeAccess(UUID documentId, UUID userId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        getDocumentOrThrow(documentId, organizationId);

        DocumentAccess access = accessRepository
                .findByDocumentIdAndUserIdAndDeletedFalse(documentId, userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Доступ не найден для пользователя: " + userId));

        access.softDelete();
        accessRepository.save(access);

        log.info("Access revoked on document {} for user {}", documentId, userId);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getDocumentHistory(UUID documentId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Document document = getDocumentOrThrow(documentId, organizationId);

        // Find the root document
        UUID rootId = document.getParentVersionId() != null ? document.getParentVersionId() : document.getId();

        List<Document> versions = documentRepository
                .findByOrganizationIdAndParentVersionIdAndDeletedFalseOrderByDocVersionDesc(organizationId, rootId);

        // Include the root document itself
        Document root = documentRepository.findByIdAndOrganizationIdAndDeletedFalse(rootId, organizationId)
                .orElse(null);

        List<DocumentResponse> result = new java.util.ArrayList<>(versions.stream()
                .map(DocumentResponse::fromEntity)
                .toList());

        if (root != null && !root.getId().equals(documentId)) {
            result.add(DocumentResponse.fromEntity(root));
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getProjectDocuments(UUID projectId, DocumentCategory category) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);

        if (category != null) {
            return documentRepository
                    .findByOrganizationIdAndProjectIdAndCategoryAndDeletedFalseOrderByCreatedAtDesc(organizationId, projectId, category)
                    .stream()
                    .map(DocumentResponse::fromEntity)
                    .toList();
        }
        return documentRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(organizationId, projectId, Pageable.unpaged())
                .map(DocumentResponse::fromEntity)
                .getContent();
    }

    @Transactional(readOnly = true)
    public Page<DocumentResponse> searchDocuments(String query, UUID projectId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        validateProjectTenant(projectId, organizationId);
        return documentRepository.searchDocuments(query, organizationId, projectId, pageable)
                .map(DocumentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<DocumentResponse> getExpiringDocuments(int daysAhead) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        LocalDate deadline = LocalDate.now().plusDays(daysAhead);
        return documentRepository.findExpiringDocuments(organizationId, deadline)
                .stream()
                .map(DocumentResponse::fromEntity)
                .toList();
    }

    private Document getDocumentOrThrow(UUID id, UUID organizationId) {
        return documentRepository.findByIdAndOrganizationIdAndDeletedFalse(id, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Документ не найден: " + id));
    }

    private CustomUserDetails requireCurrentUserDetails() {
        return SecurityUtils.getCurrentUserDetails()
                .orElseThrow(() -> new IllegalStateException("Пользователь не аутентифицирован"));
    }

    private void validateProjectTenant(UUID projectId, UUID organizationId) {
        if (projectId == null) return;
        Project project = projectRepository.findById(projectId)
                .filter(p -> !p.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));
        if (project.getOrganizationId() == null || !project.getOrganizationId().equals(organizationId)) {
            // Avoid leaking existence across tenants
            throw new EntityNotFoundException("Проект не найден: " + projectId);
        }
    }

    /**
     * Resolves (and validates) the effective projectId for a document when a contractId is provided.
     * If contractId is present and projectId is missing, we derive projectId from the contract.
     */
    private UUID resolveProjectIdForContract(UUID contractId, UUID projectId, UUID organizationId) {
        if (projectId != null) {
            validateProjectTenant(projectId, organizationId);
        }

        if (contractId == null) {
            return projectId;
        }

        Contract contract = contractRepository.findById(contractId)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Договор не найден: " + contractId));

        if (contract.getProjectId() == null) {
            throw new IllegalStateException("Договор не привязан к проекту");
        }

        UUID contractProjectId = contract.getProjectId();
        validateProjectTenant(contractProjectId, organizationId);

        if (projectId != null && !projectId.equals(contractProjectId)) {
            throw new IllegalStateException("Договор не относится к выбранному проекту");
        }

        return projectId != null ? projectId : contractProjectId;
    }

    private void validateUserTenant(UUID userId, UUID organizationId) {
        User user = userRepository.findById(userId)
                .filter(u -> !u.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + userId));
        if (user.getOrganizationId() == null || !organizationId.equals(user.getOrganizationId())) {
            throw new EntityNotFoundException("Пользователь не найден: " + userId);
        }
    }
}
