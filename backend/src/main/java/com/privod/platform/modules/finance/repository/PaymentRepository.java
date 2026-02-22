package com.privod.platform.modules.finance.repository;

import com.privod.platform.modules.finance.domain.Payment;
import com.privod.platform.modules.finance.domain.PaymentStatus;
import com.privod.platform.modules.finance.domain.PaymentType;
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
public interface PaymentRepository extends JpaRepository<Payment, UUID>, JpaSpecificationExecutor<Payment> {

    Optional<Payment> findByIdAndDeletedFalse(UUID id);

    Page<Payment> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Payment> findByProjectIdInAndDeletedFalse(List<UUID> projectIds, Pageable pageable);

    Page<Payment> findByStatusAndDeletedFalse(PaymentStatus status, Pageable pageable);

    Page<Payment> findByProjectIdInAndStatusAndDeletedFalse(List<UUID> projectIds, PaymentStatus status, Pageable pageable);

    List<Payment> findByInvoiceIdAndDeletedFalse(UUID invoiceId);

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Payment p " +
            "WHERE p.projectId = :projectId AND p.paymentType = :type " +
            "AND p.status = 'PAID' AND p.deleted = false")
    BigDecimal sumTotalByProjectIdAndType(@Param("projectId") UUID projectId,
                                          @Param("type") PaymentType type);

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Payment p " +
            "WHERE p.invoiceId = :invoiceId AND p.status = 'PAID' AND p.deleted = false")
    BigDecimal sumPaidByInvoiceId(@Param("invoiceId") UUID invoiceId);

    @Query("SELECT COALESCE(SUM(p.totalAmount), 0) FROM Payment p " +
            "WHERE p.projectId IN :projectIds AND p.paymentType = :type " +
            "AND p.status = 'PAID' AND p.deleted = false")
    BigDecimal sumNetByProjectIdsAndType(@Param("projectIds") List<UUID> projectIds,
                                         @Param("type") PaymentType type);

    @Query(value = "SELECT nextval('payment_number_seq')", nativeQuery = true)
    long getNextNumberSequence();

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
