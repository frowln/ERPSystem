package com.privod.platform.modules.search.web.dto;

import com.privod.platform.modules.search.domain.SearchEntityType;

import java.util.UUID;

public record SearchRequest(
        String query,
        SearchEntityType entityType,
        UUID projectId,
        UUID organizationId
) {
}
