package com.privod.platform.modules.maintenance.repository;

import com.privod.platform.modules.maintenance.domain.MaintenanceStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MaintenanceStageRepository extends JpaRepository<MaintenanceStage, UUID>,
        JpaSpecificationExecutor<MaintenanceStage> {

    List<MaintenanceStage> findByDeletedFalseOrderBySequenceAsc();
}
