package com.privod.platform.modules.search.web.dto;

import com.privod.platform.modules.search.domain.SearchEntityType;
import com.privod.platform.modules.search.domain.SearchIndex;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record SearchIndexResponse(
        UUID id,
        SearchEntityType entityType,
        String entityTypeDisplayName,
        UUID entityId,
        String title,
        String content,
        Map<String, Object> metadata,
        UUID projectId,
        UUID organizationId,
        Instant indexedAt,
        Instant createdAt
) {
    public static SearchIndexResponse fromEntity(SearchIndex si) {
        return new SearchIndexResponse(
                si.getId(),
                si.getEntityType(),
                si.getEntityType().getDisplayName(),
                si.getEntityId(),
                si.getTitle(),
                si.getContent(),
                si.getMetadata(),
                si.getProjectId(),
                si.getOrganizationId(),
                si.getIndexedAt(),
                si.getCreatedAt()
        );
    }
}
