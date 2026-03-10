package com.privod.platform.modules.hr.repository;

import com.privod.platform.modules.hr.domain.HrWorkOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface HrWorkOrderRepository extends JpaRepository<HrWorkOrder, UUID> {

    List<HrWorkOrder> findByOrganizationIdAndDeletedFalseOrderByDateDesc(UUID organizationId);

    List<HrWorkOrder> findByOrganizationIdAndTypeAndDeletedFalseOrderByDateDesc(UUID organizationId, HrWorkOrder.HrWorkOrderType type);

    List<HrWorkOrder> findByOrganizationIdAndStatusAndDeletedFalseOrderByDateDesc(UUID organizationId, HrWorkOrder.HrWorkOrderStatus status);

    List<HrWorkOrder> findByOrganizationIdAndTypeAndStatusAndDeletedFalseOrderByDateDesc(
            UUID organizationId, HrWorkOrder.HrWorkOrderType type, HrWorkOrder.HrWorkOrderStatus status);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);
}
