package com.privod.platform.modules.monteCarlo.repository;

import com.privod.platform.modules.monteCarlo.domain.MonteCarloSimulation;
import com.privod.platform.modules.monteCarlo.domain.SimulationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MonteCarloSimulationRepository extends JpaRepository<MonteCarloSimulation, UUID> {

    Page<MonteCarloSimulation> findByDeletedFalse(Pageable pageable);

    Page<MonteCarloSimulation> findByStatusAndDeletedFalse(SimulationStatus status, Pageable pageable);

    List<MonteCarloSimulation> findByProjectIdAndDeletedFalse(UUID projectId);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
