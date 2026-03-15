package com.privod.platform.modules.buildingModel.repository;

import com.privod.platform.modules.buildingModel.domain.BuildingFloor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BuildingFloorRepository extends JpaRepository<BuildingFloor, UUID> {
    List<BuildingFloor> findBySectionIdAndDeletedFalseOrderByFloorNumberAsc(UUID sectionId);
    List<BuildingFloor> findByProjectIdAndDeletedFalse(UUID projectId);
}
