package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.InspectionChecklistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InspectionChecklistItemRepository extends JpaRepository<InspectionChecklistItem, UUID> {

    List<InspectionChecklistItem> findByQualityCheckIdAndDeletedFalseOrderBySortOrder(UUID qualityCheckId);

    long countByQualityCheckIdAndDeletedFalse(UUID qualityCheckId);

    void deleteAllByQualityCheckId(UUID qualityCheckId);
}
