package com.privod.platform.modules.monteCarlo.repository;

import com.privod.platform.modules.monteCarlo.domain.MonteCarloTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MonteCarloTaskRepository extends JpaRepository<MonteCarloTask, UUID> {

    List<MonteCarloTask> findBySimulationIdAndDeletedFalse(UUID simulationId);

    long countBySimulationIdAndDeletedFalse(UUID simulationId);
}
