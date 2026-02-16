package com.privod.platform.modules.changeManagement.repository;

import com.privod.platform.modules.changeManagement.domain.ChangeOrder;
import com.privod.platform.modules.changeManagement.domain.ChangeOrderStatus;
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
public interface ChangeOrderRepository extends JpaRepository<ChangeOrder, UUID>,
        JpaSpecificationExecutor<ChangeOrder> {

    Page<ChangeOrder> findByDeletedFalse(Pageable pageable);

    Page<ChangeOrder> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<ChangeOrder> findByContractIdAndDeletedFalse(UUID contractId, Pageable pageable);

    List<ChangeOrder> findByContractIdAndStatusAndDeletedFalse(UUID contractId, ChangeOrderStatus status);

    @Query("SELECT COALESCE(SUM(co.totalAmount), 0) FROM ChangeOrder co " +
            "WHERE co.contractId = :contractId AND co.status = :status AND co.deleted = false")
    BigDecimal sumTotalAmountByContractIdAndStatus(@Param("contractId") UUID contractId,
                                                    @Param("status") ChangeOrderStatus status);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    @Query(value = "SELECT nextval('change_order_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
