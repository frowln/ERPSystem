package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.QualityPlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface QualityPlanRepository extends JpaRepository<QualityPlan, UUID>,
        JpaSpecificationExecutor<QualityPlan> {

    Page<QualityPlan> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<QualityPlan> findByProjectIdAndDeletedFalse(UUID projectId);
}
