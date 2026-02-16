package com.privod.platform.modules.search.service;

import com.privod.platform.modules.search.domain.SearchEntityType;
import com.privod.platform.modules.search.domain.SearchHistory;
import com.privod.platform.modules.search.domain.SearchIndex;
import com.privod.platform.modules.search.repository.SearchHistoryRepository;
import com.privod.platform.modules.search.repository.SearchIndexRepository;
import com.privod.platform.modules.search.web.dto.PopularSearchResponse;
import com.privod.platform.modules.search.web.dto.SearchHistoryResponse;
import com.privod.platform.modules.search.web.dto.SearchIndexResponse;
import com.privod.platform.modules.search.web.dto.SearchRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTest {

    @Mock
    private SearchIndexRepository searchIndexRepository;

    @Mock
    private SearchHistoryRepository searchHistoryRepository;

    @InjectMocks
    private SearchService searchService;

    private UUID userId;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        projectId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("Search")
    class SearchTests {

        @Test
        @DisplayName("Should perform full-text search and record history for authenticated user")
        void shouldSearch_andRecordHistory() {
            Pageable pageable = PageRequest.of(0, 20);
            SearchRequest request = new SearchRequest("cement", SearchEntityType.MATERIAL, projectId, null);

            SearchIndex searchIndex = SearchIndex.builder()
                    .entityType(SearchEntityType.MATERIAL)
                    .entityId(UUID.randomUUID())
                    .title("Cement M400")
                    .content("Portland cement grade M400")
                    .projectId(projectId)
                    .indexedAt(Instant.now())
                    .build();
            searchIndex.setId(UUID.randomUUID());
            searchIndex.setCreatedAt(Instant.now());

            when(searchIndexRepository.fullTextSearch("cement", "MATERIAL", projectId, null, pageable))
                    .thenReturn(new PageImpl<>(List.of(searchIndex)));
            when(searchHistoryRepository.save(any(SearchHistory.class))).thenAnswer(inv -> {
                SearchHistory h = inv.getArgument(0);
                h.setId(UUID.randomUUID());
                return h;
            });

            Page<SearchIndexResponse> results = searchService.search(request, userId, pageable);

            assertThat(results.getTotalElements()).isEqualTo(1);
            assertThat(results.getContent().get(0).title()).isEqualTo("Cement M400");
            verify(searchHistoryRepository).save(any(SearchHistory.class));
        }

        @Test
        @DisplayName("Should search without recording history when user is null")
        void shouldSearch_withoutHistory_whenUserNull() {
            Pageable pageable = PageRequest.of(0, 20);
            SearchRequest request = new SearchRequest("project", null, null, null);

            when(searchIndexRepository.fullTextSearch("project", null, null, null, pageable))
                    .thenReturn(new PageImpl<>(List.of()));

            Page<SearchIndexResponse> results = searchService.search(request, null, pageable);

            assertThat(results.getTotalElements()).isEqualTo(0);
            verify(searchHistoryRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should search without entity type filter when null")
        void shouldSearch_withoutEntityTypeFilter() {
            Pageable pageable = PageRequest.of(0, 10);
            SearchRequest request = new SearchRequest("building", null, null, null);

            when(searchIndexRepository.fullTextSearch("building", null, null, null, pageable))
                    .thenReturn(new PageImpl<>(List.of()));

            Page<SearchIndexResponse> results = searchService.search(request, userId, pageable);

            verify(searchIndexRepository).fullTextSearch("building", null, null, null, pageable);
        }
    }

    @Nested
    @DisplayName("Autocomplete")
    class AutocompleteTests {

        @Test
        @DisplayName("Should return autocomplete suggestions")
        void shouldReturnSuggestions() {
            when(searchIndexRepository.findAutocompleteSuggestions("cem"))
                    .thenReturn(List.of("Cement M400", "Cement M500", "Ceramic tiles"));

            List<String> suggestions = searchService.getAutocompleteSuggestions("cem");

            assertThat(suggestions).hasSize(3);
            assertThat(suggestions).contains("Cement M400", "Cement M500");
        }

        @Test
        @DisplayName("Should return empty list for unknown prefix")
        void shouldReturnEmpty_whenNoMatch() {
            when(searchIndexRepository.findAutocompleteSuggestions("xyz"))
                    .thenReturn(List.of());

            List<String> suggestions = searchService.getAutocompleteSuggestions("xyz");

            assertThat(suggestions).isEmpty();
        }
    }

    @Nested
    @DisplayName("Search History")
    class HistoryTests {

        @Test
        @DisplayName("Should return recent searches for user")
        void shouldReturnRecentSearches() {
            SearchHistory history = SearchHistory.builder()
                    .userId(userId)
                    .query("concrete")
                    .resultCount(15)
                    .searchedAt(Instant.now())
                    .build();
            history.setId(UUID.randomUUID());
            history.setCreatedAt(Instant.now());

            when(searchHistoryRepository.findByUserIdAndDeletedFalseOrderBySearchedAtDesc(
                    eq(userId), any(Pageable.class)))
                    .thenReturn(List.of(history));

            List<SearchHistoryResponse> recent = searchService.getRecentSearches(userId);

            assertThat(recent).hasSize(1);
            assertThat(recent.get(0).query()).isEqualTo("concrete");
        }
    }

    @Nested
    @DisplayName("Popular Searches")
    class PopularTests {

        @Test
        @DisplayName("Should return popular searches")
        void shouldReturnPopular() {
            when(searchHistoryRepository.findPopularSearches(any(Pageable.class)))
                    .thenReturn(List.of(
                            new Object[]{"cement", 42L},
                            new Object[]{"rebar", 35L},
                            new Object[]{"concrete", 28L}
                    ));

            List<PopularSearchResponse> popular = searchService.getPopularSearches();

            assertThat(popular).hasSize(3);
            assertThat(popular.get(0).query()).isEqualTo("cement");
            assertThat(popular.get(0).count()).isEqualTo(42L);
        }

        @Test
        @DisplayName("Should return empty list when no popular searches")
        void shouldReturnEmpty_whenNoPopular() {
            when(searchHistoryRepository.findPopularSearches(any(Pageable.class)))
                    .thenReturn(List.of());

            List<PopularSearchResponse> popular = searchService.getPopularSearches();

            assertThat(popular).isEmpty();
        }
    }
}
