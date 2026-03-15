package com.privod.platform.modules.buildingModel.repository;

import com.privod.platform.modules.buildingModel.domain.BuildingSection;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BuildingSectionRepository extends JpaRepository<BuildingSection, UUID> {
    List<BuildingSection> findByProjectIdAndDeletedFalseOrderBySectionOrderAsc(UUID projectId);
}
