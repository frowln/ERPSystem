package com.privod.platform.modules.search.service;

import com.privod.platform.modules.search.domain.SearchHistory;
import com.privod.platform.modules.search.repository.SearchHistoryRepository;
import com.privod.platform.modules.search.repository.SearchIndexRepository;
import com.privod.platform.modules.search.web.dto.PopularSearchResponse;
import com.privod.platform.modules.search.web.dto.SearchHistoryResponse;
import com.privod.platform.modules.search.web.dto.SearchIndexResponse;
import com.privod.platform.modules.search.web.dto.SearchRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SearchService {

    private final SearchIndexRepository searchIndexRepository;
    private final SearchHistoryRepository searchHistoryRepository;

    @Transactional
    public Page<SearchIndexResponse> search(SearchRequest request, UUID userId, Pageable pageable) {
        String entityType = request.entityType() != null ? request.entityType().name() : null;
        UUID organizationId = request.organizationId();
        if (organizationId == null) {
            throw new IllegalArgumentException("organizationId is required for search");
        }

        Page<SearchIndexResponse> results = searchIndexRepository.fullTextSearch(
                request.query(),
                entityType,
                request.projectId(),
                organizationId,
                pageable
        ).map(SearchIndexResponse::fromEntity);

        // Record search history
        if (userId != null) {
            SearchHistory history = SearchHistory.builder()
                    .userId(userId)
                    .organizationId(organizationId)
                    .query(request.query())
                    .resultCount((int) results.getTotalElements())
                    .searchedAt(Instant.now())
                    .build();
            searchHistoryRepository.save(history);
        }

        log.debug("Search query '{}' returned {} results", request.query(), results.getTotalElements());
        return results;
    }

    @Transactional(readOnly = true)
    public List<String> getAutocompleteSuggestions(String prefix, UUID organizationId) {
        return searchIndexRepository.findAutocompleteSuggestionsByOrganizationId(prefix, organizationId);
    }

    @Transactional(readOnly = true)
    public List<SearchHistoryResponse> getRecentSearches(UUID userId) {
        return searchHistoryRepository
                .findByUserIdAndDeletedFalseOrderBySearchedAtDesc(userId, PageRequest.of(0, 20))
                .stream()
                .map(SearchHistoryResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PopularSearchResponse> getPopularSearches(UUID organizationId) {
        return searchHistoryRepository.findPopularSearches(organizationId, PageRequest.of(0, 20))
                .stream()
                .map(row -> new PopularSearchResponse(
                        (String) row[0],
                        ((Number) row[1]).longValue()
                ))
                .toList();
    }
}
