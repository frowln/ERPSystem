package com.privod.platform.modules.portfolio.repository;

import com.privod.platform.modules.portfolio.domain.TenderSubmission;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TenderSubmissionRepository extends JpaRepository<TenderSubmission, UUID> {

    Page<TenderSubmission> findByBidPackageIdAndDeletedFalse(UUID bidPackageId, Pageable pageable);

    List<TenderSubmission> findByBidPackageIdAndDeletedFalseOrderByCreatedAtDesc(UUID bidPackageId);

    @Query("SELECT COALESCE(MAX(t.submissionVersion), 0) FROM TenderSubmission t " +
            "WHERE t.bidPackageId = :bidPackageId AND t.deleted = false")
    int findMaxVersionByBidPackageId(@Param("bidPackageId") UUID bidPackageId);
}
