package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.InspectionPoint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InspectionPointRepository extends JpaRepository<InspectionPoint, UUID> {

    List<InspectionPoint> findByQualityPlanIdAndDeletedFalseOrderByWorkStageAsc(UUID qualityPlanId);

    long countByQualityPlanIdAndDeletedFalse(UUID qualityPlanId);
}
