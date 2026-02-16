package com.privod.platform.modules.cde.repository;

import com.privod.platform.modules.cde.domain.TransmittalItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TransmittalItemRepository extends JpaRepository<TransmittalItem, UUID> {

    List<TransmittalItem> findByTransmittalIdAndDeletedFalseOrderBySortOrderAsc(UUID transmittalId);

    List<TransmittalItem> findByDocumentContainerIdAndDeletedFalse(UUID documentContainerId);
}
