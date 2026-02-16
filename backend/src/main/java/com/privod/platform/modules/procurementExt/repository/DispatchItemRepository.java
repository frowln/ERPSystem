package com.privod.platform.modules.procurementExt.repository;

import com.privod.platform.modules.procurementExt.domain.DispatchItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DispatchItemRepository extends JpaRepository<DispatchItem, UUID> {

    List<DispatchItem> findByOrderIdAndDeletedFalse(UUID orderId);
}
