package com.privod.platform.modules.search.repository;

import com.privod.platform.modules.search.domain.SearchHistory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SearchHistoryRepository extends JpaRepository<SearchHistory, UUID> {

    List<SearchHistory> findByUserIdAndDeletedFalseOrderBySearchedAtDesc(UUID userId, Pageable pageable);

    @Query("SELECT sh.query, COUNT(sh) as cnt FROM SearchHistory sh " +
            "WHERE sh.deleted = false AND sh.organizationId = :orgId " +
            "GROUP BY sh.query ORDER BY cnt DESC")
    List<Object[]> findPopularSearches(@Param("orgId") UUID organizationId, Pageable pageable);

    @Query("SELECT DISTINCT sh.query FROM SearchHistory sh " +
            "WHERE sh.deleted = false AND sh.userId = :userId " +
            "ORDER BY sh.searchedAt DESC")
    List<String> findRecentQueryStrings(@Param("userId") UUID userId, Pageable pageable);
}
