package com.privod.platform.modules.planning.repository;

import com.privod.platform.modules.planning.domain.ResourceAllocation;
import com.privod.platform.modules.planning.domain.ResourceType;
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
public interface ResourceAllocationRepository extends JpaRepository<ResourceAllocation, UUID> {

    List<ResourceAllocation> findByWbsNodeIdAndDeletedFalse(UUID wbsNodeId);

    Page<ResourceAllocation> findByWbsNodeIdAndDeletedFalse(UUID wbsNodeId, Pageable pageable);

    Page<ResourceAllocation> findByDeletedFalse(Pageable pageable);

    List<ResourceAllocation> findByResourceTypeAndDeletedFalse(ResourceType resourceType);

    @Query("SELECT SUM(r.plannedCost) FROM ResourceAllocation r WHERE r.wbsNodeId = :wbsNodeId AND r.deleted = false")
    BigDecimal sumPlannedCostByWbsNodeId(@Param("wbsNodeId") UUID wbsNodeId);

    @Query("SELECT SUM(r.actualCost) FROM ResourceAllocation r WHERE r.wbsNodeId = :wbsNodeId AND r.deleted = false")
    BigDecimal sumActualCostByWbsNodeId(@Param("wbsNodeId") UUID wbsNodeId);
}
