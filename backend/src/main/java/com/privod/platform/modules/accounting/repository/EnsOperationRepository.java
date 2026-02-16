package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.EnsOperation;
import com.privod.platform.modules.accounting.domain.EnsOperationStatus;
import com.privod.platform.modules.accounting.domain.EnsOperationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnsOperationRepository extends JpaRepository<EnsOperation, UUID> {

    Page<EnsOperation> findByEnsAccountIdAndDeletedFalse(UUID ensAccountId, Pageable pageable);

    Page<EnsOperation> findByOperationTypeAndDeletedFalse(EnsOperationType operationType, Pageable pageable);

    Page<EnsOperation> findByStatusAndDeletedFalse(EnsOperationStatus status, Pageable pageable);

    List<EnsOperation> findByEnsAccountIdAndOperationDateBetweenAndDeletedFalse(
            UUID ensAccountId, LocalDate from, LocalDate to);

    Page<EnsOperation> findByDeletedFalse(Pageable pageable);

    @Query("SELECT o FROM EnsOperation o WHERE o.deleted = false AND " +
            "o.ensAccountId IN (SELECT a.id FROM EnsAccount a WHERE a.deleted = false AND a.organizationId = :organizationId)")
    Page<EnsOperation> findTenantOperations(@Param("organizationId") UUID organizationId, Pageable pageable);

    @Query("SELECT o FROM EnsOperation o WHERE o.deleted = false AND o.id = :id AND " +
            "o.ensAccountId IN (SELECT a.id FROM EnsAccount a WHERE a.deleted = false AND a.organizationId = :organizationId)")
    Optional<EnsOperation> findByIdForTenant(@Param("id") UUID id, @Param("organizationId") UUID organizationId);

    @Query("SELECT COALESCE(SUM(o.amount), 0) FROM EnsOperation o " +
            "WHERE o.ensAccountId = :accountId AND o.status = 'PROCESSED' AND o.deleted = false")
    BigDecimal sumProcessedOperationsByAccount(@Param("accountId") UUID accountId);
}
