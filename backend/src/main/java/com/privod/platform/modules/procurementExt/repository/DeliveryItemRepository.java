package com.privod.platform.modules.procurementExt.repository;

import com.privod.platform.modules.procurementExt.domain.DeliveryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DeliveryItemRepository extends JpaRepository<DeliveryItem, UUID> {

    List<DeliveryItem> findByDeliveryIdAndDeletedFalse(UUID deliveryId);
}
