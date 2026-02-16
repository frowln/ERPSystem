package com.privod.platform.modules.search.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.search.domain.SearchEntityType;
import com.privod.platform.modules.search.domain.SearchIndex;
import com.privod.platform.modules.search.repository.SearchIndexRepository;
import com.privod.platform.modules.search.web.dto.IndexEntityRequest;
import com.privod.platform.modules.search.web.dto.SearchIndexResponse;
import com.privod.platform.modules.search.web.dto.SearchIndexStatusResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchIndexService {

    private final SearchIndexRepository searchIndexRepository;

    @Transactional
    public SearchIndexResponse indexEntity(IndexEntityRequest request) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        if (request.organizationId() != null && !request.organizationId().equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot index entity for another organization");
        }

        // Upsert: update if exists, create if not
        SearchIndex index = searchIndexRepository
                .findByEntityTypeAndEntityIdAndOrganizationIdAndDeletedFalse(
                        request.entityType(), request.entityId(), currentOrgId)
                .orElse(null);

        if (index != null) {
            index.setTitle(request.title());
            index.setContent(request.content());
            index.setMetadata(request.metadata());
            index.setProjectId(request.projectId());
            index.setOrganizationId(currentOrgId);
            index.setIndexedAt(Instant.now());
        } else {
            index = SearchIndex.builder()
                    .entityType(request.entityType())
                    .entityId(request.entityId())
                    .title(request.title())
                    .content(request.content())
                    .metadata(request.metadata())
                    .projectId(request.projectId())
                    .organizationId(currentOrgId)
                    .indexedAt(Instant.now())
                    .build();
        }

        index = searchIndexRepository.save(index);
        log.info("Entity indexed: {} {} ({})", request.entityType(), request.entityId(), index.getId());
        return SearchIndexResponse.fromEntity(index);
    }

    @Transactional
    public void removeEntity(SearchEntityType entityType, UUID entityId) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        searchIndexRepository.softDeleteByEntityAndOrganizationId(entityType, entityId, currentOrgId);
        log.info("Entity removed from index: {} {}", entityType, entityId);
    }

    @Transactional
    public void rebuildIndex(SearchEntityType entityType) {
        // Soft-delete existing entries for this type
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        searchIndexRepository.softDeleteByEntityTypeAndOrganizationId(entityType, currentOrgId);
        log.info("Index cleared for entity type: {}. Re-indexing should be triggered externally.", entityType);
        // In production: trigger re-indexing from source entities via events
    }

    @Transactional
    public void rebuildAll() {
        for (SearchEntityType type : SearchEntityType.values()) {
            rebuildIndex(type);
        }
        log.info("Full index rebuild initiated");
    }

    @Transactional(readOnly = true)
    public SearchIndexStatusResponse getStatus() {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        long total = searchIndexRepository.countByOrganizationIdAndDeletedFalse(currentOrgId);
        Map<String, Long> countByType = new HashMap<>();
        for (SearchEntityType type : SearchEntityType.values()) {
            countByType.put(type.name(), searchIndexRepository.countByOrganizationIdAndEntityTypeAndDeletedFalse(currentOrgId, type));
        }
        return new SearchIndexStatusResponse(total, countByType);
    }
}
