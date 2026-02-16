package com.privod.platform.modules.iot.repository;

import com.privod.platform.modules.iot.domain.IoTDashboard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IoTDashboardRepository extends JpaRepository<IoTDashboard, UUID> {

    List<IoTDashboard> findByProjectIdAndDeletedFalse(UUID projectId);

    Optional<IoTDashboard> findByIdAndDeletedFalse(UUID id);

    Optional<IoTDashboard> findByProjectIdAndIsDefaultTrueAndDeletedFalse(UUID projectId);
}
