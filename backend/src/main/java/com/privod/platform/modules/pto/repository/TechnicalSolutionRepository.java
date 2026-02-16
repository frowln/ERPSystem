package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.TechnicalSolution;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TechnicalSolutionRepository extends JpaRepository<TechnicalSolution, UUID>,
        JpaSpecificationExecutor<TechnicalSolution> {

    Page<TechnicalSolution> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<TechnicalSolution> findByProjectIdAndDeletedFalse(UUID projectId);
}
