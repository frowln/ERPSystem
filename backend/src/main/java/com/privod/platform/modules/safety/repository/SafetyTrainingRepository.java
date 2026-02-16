package com.privod.platform.modules.safety.repository;

import com.privod.platform.modules.safety.domain.SafetyTraining;
import com.privod.platform.modules.safety.domain.TrainingStatus;
import com.privod.platform.modules.safety.domain.TrainingType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SafetyTrainingRepository extends JpaRepository<SafetyTraining, UUID>,
        JpaSpecificationExecutor<SafetyTraining> {

    Page<SafetyTraining> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<SafetyTraining> findByProjectIdAndTrainingTypeAndDeletedFalse(UUID projectId, TrainingType type, Pageable pageable);

    Page<SafetyTraining> findByStatusAndDeletedFalse(TrainingStatus status, Pageable pageable);

    Page<SafetyTraining> findByDeletedFalse(Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
