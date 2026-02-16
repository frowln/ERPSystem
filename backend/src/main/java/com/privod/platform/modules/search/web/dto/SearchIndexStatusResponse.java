package com.privod.platform.modules.search.web.dto;

import java.util.Map;

public record SearchIndexStatusResponse(
        long totalIndexed,
        Map<String, Long> countByEntityType
) {
}
