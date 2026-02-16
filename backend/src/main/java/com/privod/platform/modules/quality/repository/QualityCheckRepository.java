package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.CheckResult;
import com.privod.platform.modules.quality.domain.CheckStatus;
import com.privod.platform.modules.quality.domain.QualityCheck;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QualityCheckRepository extends JpaRepository<QualityCheck, UUID>,
        JpaSpecificationExecutor<QualityCheck> {

    Page<QualityCheck> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<QualityCheck> findByDeletedFalse(Pageable pageable);

    List<QualityCheck> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, CheckStatus status);

    @Query("SELECT qc.result, COUNT(qc) FROM QualityCheck qc " +
            "WHERE qc.deleted = false AND (:projectId IS NULL OR qc.projectId = :projectId) " +
            "GROUP BY qc.result")
    List<Object[]> countByResult(@Param("projectId") UUID projectId);

    @Query("SELECT qc.status, COUNT(qc) FROM QualityCheck qc " +
            "WHERE qc.deleted = false AND (:projectId IS NULL OR qc.projectId = :projectId) " +
            "GROUP BY qc.status")
    List<Object[]> countByStatus(@Param("projectId") UUID projectId);

    @Query(value = "SELECT nextval('quality_check_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
