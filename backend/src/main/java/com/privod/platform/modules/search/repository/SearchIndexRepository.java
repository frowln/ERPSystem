package com.privod.platform.modules.search.repository;

import com.privod.platform.modules.search.domain.SearchEntityType;
import com.privod.platform.modules.search.domain.SearchIndex;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SearchIndexRepository extends JpaRepository<SearchIndex, UUID> {

    Optional<SearchIndex> findByEntityTypeAndEntityIdAndDeletedFalse(SearchEntityType entityType, UUID entityId);

    Optional<SearchIndex> findByEntityTypeAndEntityIdAndOrganizationIdAndDeletedFalse(SearchEntityType entityType,
                                                                                      UUID entityId,
                                                                                      UUID organizationId);

    List<SearchIndex> findByEntityTypeAndDeletedFalse(SearchEntityType entityType);

    @Query(value = "SELECT si.* FROM search_index si " +
            "WHERE si.deleted = false AND si.ts_vector @@ plainto_tsquery('russian', :query) " +
            "AND (:entityType IS NULL OR si.entity_type = CAST(:entityType AS VARCHAR)) " +
            "AND (:projectId IS NULL OR si.project_id = :projectId) " +
            "AND (:organizationId IS NULL OR si.organization_id = :organizationId) " +
            "ORDER BY ts_rank(si.ts_vector, plainto_tsquery('russian', :query)) DESC",
            countQuery = "SELECT COUNT(*) FROM search_index si " +
                    "WHERE si.deleted = false AND si.ts_vector @@ plainto_tsquery('russian', :query) " +
                    "AND (:entityType IS NULL OR si.entity_type = CAST(:entityType AS VARCHAR)) " +
                    "AND (:projectId IS NULL OR si.project_id = :projectId) " +
                    "AND (:organizationId IS NULL OR si.organization_id = :organizationId)",
            nativeQuery = true)
    Page<SearchIndex> fullTextSearch(@Param("query") String query,
                                      @Param("entityType") String entityType,
                                      @Param("projectId") UUID projectId,
                                      @Param("organizationId") UUID organizationId,
                                      Pageable pageable);

    @Query(value = "SELECT DISTINCT si.title FROM search_index si " +
            "WHERE si.deleted = false AND LOWER(si.title) LIKE LOWER(CONCAT(:prefix, '%')) " +
            "ORDER BY si.title LIMIT 10",
            nativeQuery = true)
    List<String> findAutocompleteSuggestions(@Param("prefix") String prefix);

    @Query(value = "SELECT DISTINCT si.title FROM search_index si " +
            "WHERE si.deleted = false AND si.organization_id = :organizationId " +
            "AND LOWER(si.title) LIKE LOWER(CONCAT(:prefix, '%')) " +
            "ORDER BY si.title LIMIT 10",
            nativeQuery = true)
    List<String> findAutocompleteSuggestionsByOrganizationId(@Param("prefix") String prefix,
                                                             @Param("organizationId") UUID organizationId);

    @Modifying
    @Query("UPDATE SearchIndex si SET si.deleted = true WHERE si.entityType = :entityType AND si.entityId = :entityId")
    void softDeleteByEntity(@Param("entityType") SearchEntityType entityType, @Param("entityId") UUID entityId);

    @Modifying
    @Query("UPDATE SearchIndex si SET si.deleted = true WHERE si.entityType = :entityType")
    void softDeleteByEntityType(@Param("entityType") SearchEntityType entityType);

    @Modifying
    @Query("UPDATE SearchIndex si SET si.deleted = true WHERE si.entityType = :entityType AND si.entityId = :entityId AND si.organizationId = :organizationId")
    void softDeleteByEntityAndOrganizationId(@Param("entityType") SearchEntityType entityType,
                                             @Param("entityId") UUID entityId,
                                             @Param("organizationId") UUID organizationId);

    @Modifying
    @Query("UPDATE SearchIndex si SET si.deleted = true WHERE si.entityType = :entityType AND si.organizationId = :organizationId")
    void softDeleteByEntityTypeAndOrganizationId(@Param("entityType") SearchEntityType entityType,
                                                 @Param("organizationId") UUID organizationId);

    long countByDeletedFalse();

    long countByEntityTypeAndDeletedFalse(SearchEntityType entityType);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);

    long countByOrganizationIdAndEntityTypeAndDeletedFalse(UUID organizationId, SearchEntityType entityType);
}
