package com.privod.platform.modules.selfEmployed.repository;

import com.privod.platform.modules.selfEmployed.domain.ActStatus;
import com.privod.platform.modules.selfEmployed.domain.CompletionAct;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Repository
public interface CompletionActRepository extends JpaRepository<CompletionAct, UUID> {

    Page<CompletionAct> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<CompletionAct> findByDeletedFalse(Pageable pageable);

    Page<CompletionAct> findByWorkerIdAndDeletedFalse(UUID workerId, Pageable pageable);

    Page<CompletionAct> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<CompletionAct> findByStatusAndDeletedFalse(ActStatus status, Pageable pageable);

    List<CompletionAct> findByWorkerIdAndStatusAndDeletedFalse(UUID workerId, ActStatus status);

    @Query("SELECT COALESCE(SUM(a.amount), 0) FROM CompletionAct a " +
            "WHERE a.worker.id = :workerId AND a.status = 'PAID' AND a.deleted = false")
    BigDecimal sumPaidAmountByWorkerId(@Param("workerId") UUID workerId);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);
}
