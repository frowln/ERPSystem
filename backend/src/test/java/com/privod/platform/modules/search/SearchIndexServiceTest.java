package com.privod.platform.modules.search;

import com.privod.platform.modules.search.domain.SearchEntityType;
import com.privod.platform.modules.search.domain.SearchIndex;
import com.privod.platform.modules.search.repository.SearchIndexRepository;
import com.privod.platform.modules.search.service.SearchIndexService;
import com.privod.platform.modules.search.web.dto.IndexEntityRequest;
import com.privod.platform.modules.search.web.dto.SearchIndexResponse;
import com.privod.platform.modules.search.web.dto.SearchIndexStatusResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchIndexServiceTest {

    @Mock
    private SearchIndexRepository searchIndexRepository;

    @InjectMocks
    private SearchIndexService searchIndexService;

    private UUID entityId;
    private UUID projectId;

    @BeforeEach
    void setUp() {
        entityId = UUID.randomUUID();
        projectId = UUID.randomUUID();
    }

    @Nested
    @DisplayName("Index Entity")
    class IndexEntityTests {

        @Test
        @DisplayName("Should create new index entry")
        void indexEntity_NewEntry() {
            IndexEntityRequest request = new IndexEntityRequest(
                    SearchEntityType.PROJECT, entityId,
                    "Строительство ЖК Рассвет",
                    "Жилой комплекс, 3 корпуса, 12 этажей",
                    Map.of("status", "ACTIVE"),
                    projectId, UUID.randomUUID()
            );

            when(searchIndexRepository.findByEntityTypeAndEntityIdAndDeletedFalse(
                    SearchEntityType.PROJECT, entityId)).thenReturn(Optional.empty());
            when(searchIndexRepository.save(any(SearchIndex.class))).thenAnswer(inv -> {
                SearchIndex si = inv.getArgument(0);
                si.setId(UUID.randomUUID());
                si.setCreatedAt(Instant.now());
                return si;
            });

            SearchIndexResponse response = searchIndexService.indexEntity(request);

            assertThat(response.entityType()).isEqualTo(SearchEntityType.PROJECT);
            assertThat(response.entityId()).isEqualTo(entityId);
            assertThat(response.title()).isEqualTo("Строительство ЖК Рассвет");
        }

        @Test
        @DisplayName("Should update existing index entry")
        void indexEntity_UpdateExisting() {
            SearchIndex existing = SearchIndex.builder()
                    .entityType(SearchEntityType.PROJECT)
                    .entityId(entityId)
                    .title("Старое название")
                    .content("Старое содержание")
                    .build();
            existing.setId(UUID.randomUUID());
            existing.setCreatedAt(Instant.now());

            IndexEntityRequest request = new IndexEntityRequest(
                    SearchEntityType.PROJECT, entityId,
                    "Обновлённое название",
                    "Обновлённое содержание",
                    null, projectId, null
            );

            when(searchIndexRepository.findByEntityTypeAndEntityIdAndDeletedFalse(
                    SearchEntityType.PROJECT, entityId)).thenReturn(Optional.of(existing));
            when(searchIndexRepository.save(any(SearchIndex.class))).thenAnswer(inv -> inv.getArgument(0));

            SearchIndexResponse response = searchIndexService.indexEntity(request);

            assertThat(response.title()).isEqualTo("Обновлённое название");
            assertThat(response.content()).isEqualTo("Обновлённое содержание");
        }
    }

    @Nested
    @DisplayName("Remove Entity")
    class RemoveEntityTests {

        @Test
        @DisplayName("Should soft-delete entity from index")
        void removeEntity_SoftDeletes() {
            searchIndexService.removeEntity(SearchEntityType.DOCUMENT, entityId);
            verify(searchIndexRepository).softDeleteByEntity(SearchEntityType.DOCUMENT, entityId);
        }
    }

    @Nested
    @DisplayName("Status")
    class StatusTests {

        @Test
        @DisplayName("Should return index status with counts")
        void getStatus_ReturnsCounts() {
            when(searchIndexRepository.countByDeletedFalse()).thenReturn(100L);
            when(searchIndexRepository.countByEntityTypeAndDeletedFalse(any())).thenReturn(15L);

            SearchIndexStatusResponse status = searchIndexService.getStatus();

            assertThat(status.totalIndexed()).isEqualTo(100L);
            assertThat(status.countByEntityType()).containsKey("PROJECT");
        }
    }
}
