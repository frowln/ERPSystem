package com.privod.platform.modules.search.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.infrastructure.web.PageResponse;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.search.domain.SearchEntityType;
import com.privod.platform.modules.search.service.SearchService;
import com.privod.platform.modules.search.web.dto.PopularSearchResponse;
import com.privod.platform.modules.search.web.dto.SearchHistoryResponse;
import com.privod.platform.modules.search.web.dto.SearchIndexResponse;
import com.privod.platform.modules.search.web.dto.SearchRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;
import org.springframework.security.access.prepost.PreAuthorize;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@Tag(name = "Search", description = "Full-text search endpoints")
@PreAuthorize("isAuthenticated()")
public class SearchController {

    private final SearchService searchService;

    @GetMapping
    @Operation(summary = "Full-text search across all indexed entities")
    public ResponseEntity<ApiResponse<PageResponse<SearchIndexResponse>>> search(
            @RequestParam String query,
            @RequestParam(required = false) SearchEntityType entityType,
            @RequestParam(required = false) UUID projectId,
            @RequestParam(required = false) UUID organizationId,
            @RequestParam(required = false) UUID userId,
            @PageableDefault(size = 20) Pageable pageable) {

        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();

        if (organizationId != null && !organizationId.equals(currentOrgId)) {
            throw new AccessDeniedException("Cannot search in another organization");
        }
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot record search history for another user");
        }

        SearchRequest request = new SearchRequest(query, entityType, projectId, currentOrgId);
        Page<SearchIndexResponse> results = searchService.search(request, currentUserId, pageable);
        return ResponseEntity.ok(ApiResponse.ok(PageResponse.of(results)));
    }

    @GetMapping("/autocomplete")
    @Operation(summary = "Get autocomplete suggestions for search prefix")
    public ResponseEntity<ApiResponse<List<String>>> autocomplete(
            @RequestParam String prefix) {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        List<String> suggestions = searchService.getAutocompleteSuggestions(prefix, currentOrgId);
        return ResponseEntity.ok(ApiResponse.ok(suggestions));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent searches for user")
    public ResponseEntity<ApiResponse<List<SearchHistoryResponse>>> recentSearches(
            @RequestParam(required = false) UUID userId) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        if (userId != null && !userId.equals(currentUserId)) {
            throw new AccessDeniedException("Cannot access search history for another user");
        }
        List<SearchHistoryResponse> recent = searchService.getRecentSearches(currentUserId);
        return ResponseEntity.ok(ApiResponse.ok(recent));
    }

    @GetMapping("/popular")
    @Operation(summary = "Get popular searches")
    public ResponseEntity<ApiResponse<List<PopularSearchResponse>>> popularSearches() {
        UUID currentOrgId = SecurityUtils.requireCurrentOrganizationId();
        List<PopularSearchResponse> popular = searchService.getPopularSearches(currentOrgId);
        return ResponseEntity.ok(ApiResponse.ok(popular));
    }
}
