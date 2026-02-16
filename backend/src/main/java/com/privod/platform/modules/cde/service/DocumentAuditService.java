package com.privod.platform.modules.cde.service;

import com.privod.platform.modules.cde.repository.DocumentAuditEntryRepository;
import com.privod.platform.modules.cde.web.dto.DocumentAuditEntryResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentAuditService {

    private final DocumentAuditEntryRepository documentAuditEntryRepository;

    @Transactional(readOnly = true)
    public List<DocumentAuditEntryResponse> getAuditTrail(UUID documentContainerId) {
        return documentAuditEntryRepository.findByDocumentContainerIdOrderByPerformedAtDesc(documentContainerId)
                .stream()
                .map(DocumentAuditEntryResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<DocumentAuditEntryResponse> getAuditTrailPaged(UUID documentContainerId, Pageable pageable) {
        return documentAuditEntryRepository.findByDocumentContainerIdOrderByPerformedAtDesc(
                        documentContainerId, pageable)
                .map(DocumentAuditEntryResponse::fromEntity);
    }
}
