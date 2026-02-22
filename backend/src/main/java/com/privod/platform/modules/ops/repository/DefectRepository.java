package com.privod.platform.modules.ops.repository;

import com.privod.platform.modules.ops.domain.Defect;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DefectRepository extends JpaRepository<Defect, UUID>, JpaSpecificationExecutor<Defect> {

    @Query(value = "SELECT nextval('defect_code_seq')", nativeQuery = true)
    long getNextCodeSequence();

    @Query("SELECT COUNT(d) FROM Defect d WHERE d.deleted = false AND d.status IN ('OPEN', 'IN_PROGRESS')")
    long countOpen();

    @Query("SELECT COUNT(d) FROM Defect d WHERE d.deleted = false " +
            "AND d.status IN ('OPEN', 'IN_PROGRESS') " +
            "AND d.fixDeadline IS NOT NULL AND d.fixDeadline < CURRENT_DATE")
    long countOverdue();

    @Query(
            value = "SELECT AVG(EXTRACT(EPOCH FROM (fixed_at - created_at)) / 3600.0) " +
                    "FROM defects WHERE deleted = false AND fixed_at IS NOT NULL",
            nativeQuery = true
    )
    Double avgResolutionHours();

    @Query("SELECT CAST(d.severity AS string), COUNT(d) FROM Defect d " +
            "WHERE d.deleted = false AND d.status IN ('OPEN', 'IN_PROGRESS') GROUP BY d.severity")
    List<Object[]> countOpenBySeverity();

    @Query("SELECT d.contractorId, CAST(d.status AS string), COUNT(d) FROM Defect d " +
            "WHERE d.deleted = false AND d.contractorId IS NOT NULL GROUP BY d.contractorId, d.status")
    List<Object[]> countByContractorAndStatus();

    @Query("SELECT d.projectId, CAST(d.status AS string), COUNT(d) FROM Defect d " +
            "WHERE d.deleted = false GROUP BY d.projectId, d.status")
    List<Object[]> countByProjectAndStatus();
}
