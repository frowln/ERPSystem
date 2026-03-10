package com.privod.platform.modules.common.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.infrastructure.storage.StorageService;
import com.privod.platform.modules.common.domain.FileAttachment;
import com.privod.platform.modules.common.repository.FileAttachmentRepository;
import com.privod.platform.modules.common.web.dto.CreateFileAttachmentRequest;
import com.privod.platform.modules.common.web.dto.FileAttachmentResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileAttachmentService {

    private final FileAttachmentRepository repository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public List<FileAttachmentResponse> listAttachments(String entityType, UUID entityId) {
        return repository.findByEntityTypeAndEntityIdAndDeletedFalseOrderByCreatedAtDesc(entityType, entityId)
                .stream()
                .map(FileAttachmentResponse::fromEntity)
                .toList();
    }

    @Transactional
    public FileAttachmentResponse createAttachment(CreateFileAttachmentRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String currentUser = SecurityUtils.getCurrentUserDetails()
                .map(u -> u.getUsername())
                .orElse(null);

        FileAttachment attachment = FileAttachment.builder()
                .organizationId(organizationId)
                .entityType(request.entityType())
                .entityId(request.entityId())
                .fileName(request.fileName())
                .fileSize(request.fileSize())
                .contentType(request.contentType())
                .storagePath(request.storagePath())
                .description(request.description())
                .uploadedBy(currentUser)
                .build();

        FileAttachment saved = repository.save(attachment);
        log.info("Created file attachment {} for {}:{}", saved.getId(), request.entityType(), request.entityId());
        return FileAttachmentResponse.fromEntity(saved);
    }

    @Transactional
    public FileAttachmentResponse uploadAttachment(MultipartFile file, String entityType, UUID entityId, String description) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String currentUser = SecurityUtils.getCurrentUserDetails()
                .map(u -> u.getUsername())
                .orElse(null);

        String storagePath = storageService.upload(file, "attachments");
        log.info("Uploaded file '{}' to storage path: {}", file.getOriginalFilename(), storagePath);

        FileAttachment attachment = FileAttachment.builder()
                .organizationId(organizationId)
                .entityType(entityType)
                .entityId(entityId)
                .fileName(file.getOriginalFilename())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .storagePath(storagePath)
                .description(description)
                .uploadedBy(currentUser)
                .build();

        FileAttachment saved = repository.save(attachment);
        log.info("Created file attachment {} for {}:{} (uploaded)", saved.getId(), entityType, entityId);
        return FileAttachmentResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public String getDownloadUrl(UUID attachmentId) {
        FileAttachment attachment = repository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Attachment not found: " + attachmentId));
        if (attachment.getStoragePath() == null || attachment.getStoragePath().isBlank()) {
            throw new IllegalStateException("Attachment has no storage path: " + attachmentId);
        }
        return storageService.getPresignedUrl(attachment.getStoragePath());
    }

    @Transactional
    public void deleteAttachment(UUID id) {
        FileAttachment attachment = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Attachment not found: " + id));

        // Delete from storage if path exists
        if (attachment.getStoragePath() != null && !attachment.getStoragePath().isBlank()) {
            try {
                storageService.delete(attachment.getStoragePath());
                log.info("Deleted file from storage: {}", attachment.getStoragePath());
            } catch (Exception e) {
                log.warn("Failed to delete file from storage: {}. Proceeding with soft-delete.", attachment.getStoragePath(), e);
            }
        }

        attachment.softDelete();
        repository.save(attachment);
        log.info("Soft-deleted attachment {}", id);
    }
}
