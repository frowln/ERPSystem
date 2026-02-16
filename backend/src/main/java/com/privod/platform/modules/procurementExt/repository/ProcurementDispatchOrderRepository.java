package com.privod.platform.modules.procurementExt.repository;

import com.privod.platform.modules.ops.domain.DispatchOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ProcurementDispatchOrderRepository extends JpaRepository<DispatchOrder, UUID>, JpaSpecificationExecutor<DispatchOrder> {

    @Query(value = "SELECT nextval('dispatch_order_code_seq')", nativeQuery = true)
    long getNextCodeSequence();
}
