package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.InventoryCheck;
import com.privod.platform.modules.warehouse.domain.InventoryCheckStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface InventoryCheckRepository extends JpaRepository<InventoryCheck, UUID>,
        JpaSpecificationExecutor<InventoryCheck> {

    Page<InventoryCheck> findByLocationIdAndDeletedFalse(UUID locationId, Pageable pageable);

    Page<InventoryCheck> findByStatusAndDeletedFalse(InventoryCheckStatus status, Pageable pageable);

    @Query(value = "SELECT nextval('inventory_check_number_seq')", nativeQuery = true)
    long getNextNumberSequence();
}
