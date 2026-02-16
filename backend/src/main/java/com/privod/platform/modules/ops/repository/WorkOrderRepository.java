package com.privod.platform.modules.ops.repository;

import com.privod.platform.modules.ops.domain.WorkOrder;
import com.privod.platform.modules.ops.domain.WorkOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkOrderRepository extends JpaRepository<WorkOrder, UUID>, JpaSpecificationExecutor<WorkOrder> {

    @Query(value = "SELECT nextval('work_order_code_seq')", nativeQuery = true)
    long getNextCodeSequence();

    @Query("SELECT wo.status, COUNT(wo) FROM WorkOrder wo WHERE wo.deleted = false " +
            "AND (:projectId IS NULL OR wo.projectId = :projectId) GROUP BY wo.status")
    List<Object[]> countByStatusForProject(@Param("projectId") UUID projectId);
}
