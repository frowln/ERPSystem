package com.privod.platform.modules.search;

import com.privod.platform.modules.search.domain.SearchEntityType;
import com.privod.platform.modules.search.domain.SearchHistory;
import com.privod.platform.modules.search.domain.SearchIndex;
import com.privod.platform.modules.search.repository.SearchHistoryRepository;
import com.privod.platform.modules.search.repository.SearchIndexRepository;
import com.privod.platform.modules.search.service.SearchService;
import com.privod.platform.modules.search.web.dto.PopularSearchResponse;
import com.privod.platform.modules.search.web.dto.SearchHistoryResponse;
import com.privod.platform.modules.search.web.dto.SearchIndexResponse;
import com.privod.platform.modules.search.web.dto.SearchRequest;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
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

    @Nested
    @DisplayName("Search")
    class SearchTests {

        @Test
        @DisplayName("Should perform full-text search and record history")
        void search_ReturnsResultsAndRecordsHistory() {
            UUID userId = UUID.randomUUID();
            SearchRequest request = new SearchRequest("жилой комплекс", null, null, null);
            Pageable pageable = PageRequest.of(0, 20);

            SearchIndex si = SearchIndex.builder()
                    .entityType(SearchEntityType.PROJECT)
                    .entityId(UUID.randomUUID())
                    .title("Строительство ЖК Рассвет")
                    .content("Жилой комплекс, 3 корпуса")
                    .indexedAt(Instant.now())
                    .build();
            si.setId(UUID.randomUUID());
            si.setCreatedAt(Instant.now());

            Page<SearchIndex> page = new PageImpl<>(List.of(si), pageable, 1);
            when(searchIndexRepository.fullTextSearch(anyString(), isNull(), isNull(), isNull(), eq(pageable)))
                    .thenReturn(page);
            when(searchHistoryRepository.save(any(SearchHistory.class)))
                    .thenAnswer(inv -> inv.getArgument(0));

            Page<SearchIndexResponse> results = searchService.search(request, userId, pageable);

            assertThat(results.getContent()).hasSize(1);
            assertThat(results.getContent().get(0).title()).contains("ЖК Рассвет");
            verify(searchHistoryRepository).save(any(SearchHistory.class));
        }
    }

    @Nested
    @DisplayName("Autocomplete")
    class AutocompleteTests {

        @Test
        @DisplayName("Should return autocomplete suggestions")
        void getAutocompleteSuggestions_ReturnsList() {
            when(searchIndexRepository.findAutocompleteSuggestions("строит"))
                    .thenReturn(List.of("Строительство ЖК Рассвет", "Строительство моста"));

            List<String> suggestions = searchService.getAutocompleteSuggestions("строит");

            assertThat(suggestions).hasSize(2);
            assertThat(suggestions).contains("Строительство ЖК Рассвет");
        }
    }

    @Nested
    @DisplayName("Popular Searches")
    class PopularSearchesTests {

        @Test
        @DisplayName("Should return popular search queries")
        void getPopularSearches_ReturnsList() {
            when(searchHistoryRepository.findPopularSearches(any(Pageable.class)))
                    .thenReturn(List.of(
                            new Object[]{"акт КС-2", 42L},
                            new Object[]{"сметы", 30L}
                    ));

            List<PopularSearchResponse> popular = searchService.getPopularSearches();

            assertThat(popular).hasSize(2);
            assertThat(popular.get(0).query()).isEqualTo("акт КС-2");
            assertThat(popular.get(0).count()).isEqualTo(42L);
        }
    }
}
