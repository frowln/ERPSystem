package com.privod.platform.modules.costManagement.repository;

import com.privod.platform.modules.costManagement.domain.Commitment;
import com.privod.platform.modules.costManagement.domain.CommitmentStatus;
import com.privod.platform.modules.costManagement.domain.CommitmentType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface CommitmentRepository extends JpaRepository<Commitment, UUID>, JpaSpecificationExecutor<Commitment> {

    Page<Commitment> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Commitment> findByDeletedFalse(Pageable pageable);

    Page<Commitment> findByStatusAndDeletedFalse(CommitmentStatus status, Pageable pageable);

    List<Commitment> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, CommitmentStatus status);

    @Query("SELECT COALESCE(SUM(c.originalAmount), 0) FROM Commitment c " +
            "WHERE c.projectId = :projectId AND c.deleted = false AND c.status <> 'VOID'")
    BigDecimal sumOriginalAmountByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(c.revisedAmount), 0) FROM Commitment c " +
            "WHERE c.projectId = :projectId AND c.deleted = false AND c.status <> 'VOID'")
    BigDecimal sumRevisedAmountByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT c.status, COUNT(c) FROM Commitment c WHERE c.deleted = false AND " +
            "(:projectId IS NULL OR c.projectId = :projectId) GROUP BY c.status")
    List<Object[]> countByStatusAndProjectId(@Param("projectId") UUID projectId);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    @Query(value = "SELECT nextval('commitment_number_seq')", nativeQuery = true)
    long getNextNumberSequence();

    List<Commitment> findByCostCodeIdAndDeletedFalse(UUID costCodeId);
}
