package com.privod.platform.modules.warehouse.repository;

import com.privod.platform.modules.warehouse.domain.InventoryCheckLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InventoryCheckLineRepository extends JpaRepository<InventoryCheckLine, UUID> {

    List<InventoryCheckLine> findByCheckIdAndDeletedFalse(UUID checkId);

    Optional<InventoryCheckLine> findByIdAndCheckIdAndDeletedFalse(UUID id, UUID checkId);

    void deleteByCheckId(UUID checkId);
}
