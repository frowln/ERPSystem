package com.privod.platform.modules.ops.repository;

import com.privod.platform.modules.ops.domain.DispatchOrder;
import com.privod.platform.modules.ops.domain.DispatchStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface DispatchOrderRepository extends JpaRepository<DispatchOrder, UUID> {

    Page<DispatchOrder> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<DispatchOrder> findByStatusAndDeletedFalse(DispatchStatus status, Pageable pageable);

    Page<DispatchOrder> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, DispatchStatus status, Pageable pageable);

    List<DispatchOrder> findByVehicleIdAndScheduledDateAndDeletedFalse(UUID vehicleId, LocalDate scheduledDate);

    List<DispatchOrder> findByDriverIdAndScheduledDateAndDeletedFalse(UUID driverId, LocalDate scheduledDate);

    Page<DispatchOrder> findByDeletedFalse(Pageable pageable);

    @Query("SELECT d.status, COUNT(d) FROM DispatchOrder d WHERE d.deleted = false " +
            "AND (:projectId IS NULL OR d.projectId = :projectId) GROUP BY d.status")
    List<Object[]> countByStatusForProject(@Param("projectId") UUID projectId);

    boolean existsByOrderNumberAndDeletedFalse(String orderNumber);
}
