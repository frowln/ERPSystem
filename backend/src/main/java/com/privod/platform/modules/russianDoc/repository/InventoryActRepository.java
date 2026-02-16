package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.InventoryAct;
import com.privod.platform.modules.russianDoc.domain.RussianDocStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InventoryActRepository extends JpaRepository<InventoryAct, UUID> {

    Page<InventoryAct> findByDeletedFalse(Pageable pageable);

    Page<InventoryAct> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<InventoryAct> findByWarehouseIdAndDeletedFalseOrderByDateDesc(UUID warehouseId);

    List<InventoryAct> findByStatusAndDeletedFalse(RussianDocStatus status);
}
