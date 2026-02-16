package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.EnsPayment;
import com.privod.platform.modules.accounting.domain.EnsPaymentStatus;
import com.privod.platform.modules.accounting.domain.EnsTaxType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnsPaymentRepository extends JpaRepository<EnsPayment, UUID> {

    Page<EnsPayment> findByEnsAccountIdAndDeletedFalse(UUID ensAccountId, Pageable pageable);

    Page<EnsPayment> findByTaxTypeAndDeletedFalse(EnsTaxType taxType, Pageable pageable);

    Page<EnsPayment> findByStatusAndDeletedFalse(EnsPaymentStatus status, Pageable pageable);

    /**
     * Tenant-safe listing: payments belong to a tenant through their ENS account.
     * Uses a subquery because we intentionally keep UUID FKs instead of JPA relations.
     */
    @Query("SELECT p FROM EnsPayment p WHERE p.deleted = false AND " +
            "p.ensAccountId IN (SELECT a.id FROM EnsAccount a WHERE a.deleted = false AND a.organizationId = :organizationId)")
    Page<EnsPayment> findTenantPayments(@Param("organizationId") UUID organizationId, Pageable pageable);

    @Query("SELECT p FROM EnsPayment p WHERE p.deleted = false AND p.id = :id AND " +
            "p.ensAccountId IN (SELECT a.id FROM EnsAccount a WHERE a.deleted = false AND a.organizationId = :organizationId)")
    Optional<EnsPayment> findByIdForTenant(@Param("id") UUID id, @Param("organizationId") UUID organizationId);

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM EnsPayment p " +
            "WHERE p.ensAccountId = :accountId AND p.status <> 'DRAFT' AND p.deleted = false")
    BigDecimal sumConfirmedPaymentsByAccount(@Param("accountId") UUID accountId);

    @Query(value = "SELECT nextval('ens_payment_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
