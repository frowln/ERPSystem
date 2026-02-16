package com.privod.platform.modules.regulatory.repository;

import com.privod.platform.modules.regulatory.domain.RegulatoryReport;
import com.privod.platform.modules.regulatory.domain.ReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RegulatoryReportRepository extends JpaRepository<RegulatoryReport, UUID> {

    Optional<RegulatoryReport> findByIdAndDeletedFalse(UUID id);

    Page<RegulatoryReport> findByProjectIdInAndDeletedFalse(List<UUID> projectIds, Pageable pageable);

    Page<RegulatoryReport> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<RegulatoryReport> findByStatusAndDeletedFalse(ReportStatus status, Pageable pageable);

    @Query("SELECT r.status, COUNT(r) FROM RegulatoryReport r " +
            "WHERE r.deleted = false AND (:projectId IS NULL OR r.projectId = :projectId) " +
            "GROUP BY r.status")
    List<Object[]> countByStatus(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(r) FROM RegulatoryReport r " +
            "WHERE r.deleted = false AND (:projectId IS NULL OR r.projectId = :projectId)")
    long countTotal(@Param("projectId") UUID projectId);

    @Query(value = "SELECT nextval('regulatory_report_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
