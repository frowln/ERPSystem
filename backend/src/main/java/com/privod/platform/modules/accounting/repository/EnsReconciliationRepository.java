package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.EnsReconciliation;
import com.privod.platform.modules.accounting.domain.EnsReconciliationStatus;
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
public interface EnsReconciliationRepository extends JpaRepository<EnsReconciliation, UUID> {

    Page<EnsReconciliation> findByEnsAccountIdAndDeletedFalse(UUID ensAccountId, Pageable pageable);

    List<EnsReconciliation> findByStatusAndDeletedFalse(EnsReconciliationStatus status);

    Page<EnsReconciliation> findByDeletedFalse(Pageable pageable);

    @Query("SELECT r FROM EnsReconciliation r WHERE r.deleted = false AND " +
            "r.ensAccountId IN (SELECT a.id FROM EnsAccount a WHERE a.deleted = false AND a.organizationId = :organizationId)")
    Page<EnsReconciliation> findTenantReconciliations(@Param("organizationId") UUID organizationId, Pageable pageable);

    @Query("SELECT r FROM EnsReconciliation r WHERE r.deleted = false AND r.id = :id AND " +
            "r.ensAccountId IN (SELECT a.id FROM EnsAccount a WHERE a.deleted = false AND a.organizationId = :organizationId)")
    Optional<EnsReconciliation> findByIdForTenant(@Param("id") UUID id, @Param("organizationId") UUID organizationId);
}
