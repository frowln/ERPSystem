package com.privod.platform.modules.buildingModel.repository;

import com.privod.platform.modules.buildingModel.domain.BuildingRoom;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface BuildingRoomRepository extends JpaRepository<BuildingRoom, UUID> {
    List<BuildingRoom> findByFloorIdAndDeletedFalseOrderByRoomNumberAsc(UUID floorId);
    List<BuildingRoom> findByProjectIdAndDeletedFalse(UUID projectId);
}
