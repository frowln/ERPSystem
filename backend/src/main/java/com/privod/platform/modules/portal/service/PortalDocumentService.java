package com.privod.platform.modules.portal.service;

import com.privod.platform.modules.portal.domain.PortalDocument;
import com.privod.platform.modules.portal.repository.PortalDocumentRepository;
import com.privod.platform.modules.portal.web.dto.PortalDocumentResponse;
import com.privod.platform.modules.portal.web.dto.ShareDocumentRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortalDocumentService {

    private final PortalDocumentRepository portalDocumentRepository;

    @Transactional(readOnly = true)
    public Page<PortalDocumentResponse> getSharedDocuments(UUID portalUserId, Pageable pageable) {
        return portalDocumentRepository.findActiveByPortalUserId(portalUserId, pageable)
                .map(PortalDocumentResponse::fromEntity);
    }

    @Transactional
    public PortalDocumentResponse download(UUID portalUserId, UUID documentId) {
        PortalDocument doc = portalDocumentRepository
                .findByPortalUserIdAndDocumentIdAndDeletedFalse(portalUserId, documentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Документ не найден или доступ не предоставлен: " + documentId));

        if (doc.isExpired()) {
            throw new IllegalStateException("Срок доступа к документу истек");
        }

        doc.incrementDownloadCount();
        portalDocumentRepository.save(doc);

        log.info("Portal document downloaded: user={}, document={}, count={}",
                portalUserId, documentId, doc.getDownloadCount());
        return PortalDocumentResponse.fromEntity(doc);
    }

    @Transactional
    public PortalDocumentResponse shareDocument(ShareDocumentRequest request) {
        // Check if already shared
        portalDocumentRepository
                .findByPortalUserIdAndDocumentIdAndDeletedFalse(request.portalUserId(), request.documentId())
                .ifPresent(existing -> {
                    throw new IllegalArgumentException(
                            "Документ уже предоставлен данному пользователю: " + request.documentId());
                });

        PortalDocument doc = PortalDocument.builder()
                .portalUserId(request.portalUserId())
                .projectId(request.projectId())
                .documentId(request.documentId())
                .sharedById(request.sharedById())
                .sharedAt(Instant.now())
                .expiresAt(request.expiresAt())
                .build();

        doc = portalDocumentRepository.save(doc);
        log.info("Document shared with portal user: user={}, document={}",
                request.portalUserId(), request.documentId());
        return PortalDocumentResponse.fromEntity(doc);
    }
}
