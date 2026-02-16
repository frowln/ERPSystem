package com.privod.platform.modules.procurementExt.repository;

import com.privod.platform.modules.procurementExt.domain.Delivery;
import com.privod.platform.modules.procurementExt.domain.DeliveryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, UUID>, JpaSpecificationExecutor<Delivery> {

    List<Delivery> findByStatusAndDeletedFalse(DeliveryStatus status);

    List<Delivery> findByRouteIdAndDeletedFalse(UUID routeId);
}
