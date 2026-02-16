package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.AbcCategory;
import com.privod.platform.modules.analytics.domain.AbcXyzAnalysis;
import com.privod.platform.modules.analytics.domain.XyzCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface AbcXyzAnalysisRepository extends JpaRepository<AbcXyzAnalysis, UUID>, JpaSpecificationExecutor<AbcXyzAnalysis> {

    Page<AbcXyzAnalysis> findByProjectIdAndDeletedFalseOrderByAnalysisDateDesc(
            UUID projectId, Pageable pageable);

    List<AbcXyzAnalysis> findByProjectIdAndAnalysisDateAndDeletedFalse(
            UUID projectId, LocalDate analysisDate);

    List<AbcXyzAnalysis> findByProjectIdAndAbcCategoryAndDeletedFalse(
            UUID projectId, AbcCategory abcCategory);

    List<AbcXyzAnalysis> findByProjectIdAndXyzCategoryAndDeletedFalse(
            UUID projectId, XyzCategory xyzCategory);

    @Query("SELECT a FROM AbcXyzAnalysis a WHERE a.deleted = false " +
            "AND a.projectId = :projectId " +
            "AND (:entityType IS NULL OR a.entityType = :entityType) " +
            "AND (:abcCategory IS NULL OR a.abcCategory = :abcCategory) " +
            "AND (:xyzCategory IS NULL OR a.xyzCategory = :xyzCategory) " +
            "ORDER BY a.analysisDate DESC, a.totalValue DESC")
    Page<AbcXyzAnalysis> findByFilters(@Param("projectId") UUID projectId,
                                        @Param("entityType") String entityType,
                                        @Param("abcCategory") AbcCategory abcCategory,
                                        @Param("xyzCategory") XyzCategory xyzCategory,
                                        Pageable pageable);
}
