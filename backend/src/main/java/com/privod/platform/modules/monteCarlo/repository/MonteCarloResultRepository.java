package com.privod.platform.modules.monteCarlo.repository;

import com.privod.platform.modules.monteCarlo.domain.MonteCarloResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface MonteCarloResultRepository extends JpaRepository<MonteCarloResult, UUID> {

    List<MonteCarloResult> findBySimulationIdAndDeletedFalseOrderByPercentileAsc(UUID simulationId);

    void deleteBySimulationId(UUID simulationId);
}
