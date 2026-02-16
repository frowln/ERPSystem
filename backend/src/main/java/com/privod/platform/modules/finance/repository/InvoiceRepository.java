package com.privod.platform.modules.finance.repository;

import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.domain.InvoiceStatus;
import com.privod.platform.modules.finance.domain.InvoiceType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, UUID>, JpaSpecificationExecutor<Invoice> {

    Optional<Invoice> findByIdAndDeletedFalse(UUID id);

    Page<Invoice> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Invoice> findByProjectIdInAndDeletedFalse(List<UUID> projectIds, Pageable pageable);

    Page<Invoice> findByStatusAndDeletedFalse(InvoiceStatus status, Pageable pageable);

    Page<Invoice> findByProjectIdInAndStatusAndDeletedFalse(List<UUID> projectIds, InvoiceStatus status, Pageable pageable);

    List<Invoice> findByContractIdAndDeletedFalse(UUID contractId);

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
            "WHERE i.projectId = :projectId AND i.invoiceType = :type " +
            "AND i.status NOT IN ('DRAFT', 'CANCELLED') AND i.deleted = false")
    BigDecimal sumTotalByProjectIdAndType(@Param("projectId") UUID projectId,
                                          @Param("type") InvoiceType type);

    @Query("SELECT COUNT(i) FROM Invoice i " +
            "WHERE i.projectId = :projectId AND i.status = 'OVERDUE' AND i.deleted = false")
    long countOverdueByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COALESCE(SUM(i.remainingAmount), 0) FROM Invoice i " +
            "WHERE i.projectId = :projectId AND i.status = 'OVERDUE' AND i.deleted = false")
    BigDecimal sumOverdueAmountByProjectId(@Param("projectId") UUID projectId);

    @Query(value = "SELECT nextval('invoice_number_seq')", nativeQuery = true)
    long getNextNumberSequence();

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
