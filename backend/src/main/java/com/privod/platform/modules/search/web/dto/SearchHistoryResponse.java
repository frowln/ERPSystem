package com.privod.platform.modules.search.web.dto;

import com.privod.platform.modules.search.domain.SearchEntityType;
import com.privod.platform.modules.search.domain.SearchHistory;

import java.time.Instant;
import java.util.UUID;

public record SearchHistoryResponse(
        UUID id,
        UUID userId,
        String query,
        Integer resultCount,
        SearchEntityType clickedEntityType,
        UUID clickedEntityId,
        Instant searchedAt
) {
    public static SearchHistoryResponse fromEntity(SearchHistory sh) {
        return new SearchHistoryResponse(
                sh.getId(),
                sh.getUserId(),
                sh.getQuery(),
                sh.getResultCount(),
                sh.getClickedEntityType(),
                sh.getClickedEntityId(),
                sh.getSearchedAt()
        );
    }
}
