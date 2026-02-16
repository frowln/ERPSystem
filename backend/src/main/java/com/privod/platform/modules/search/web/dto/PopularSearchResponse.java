package com.privod.platform.modules.search.web.dto;

public record PopularSearchResponse(
        String query,
        long count
) {
}
