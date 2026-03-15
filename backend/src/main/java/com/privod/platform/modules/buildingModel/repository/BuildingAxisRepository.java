package com.privod.platform.modules.buildingModel.repository;

import com.privod.platform.modules.buildingModel.domain.BuildingAxis;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BuildingAxisRepository extends JpaRepository<BuildingAxis, UUID> {
    List<BuildingAxis> findBySectionIdAndDeletedFalseOrderByNameAsc(UUID sectionId);
}
