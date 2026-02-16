package com.privod.platform.modules.ai.repository;

import com.privod.platform.modules.ai.domain.AiPrediction;
import com.privod.platform.modules.ai.domain.PredictionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AiPredictionRepository extends JpaRepository<AiPrediction, UUID> {

    Page<AiPrediction> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<AiPrediction> findByProjectIdAndPredictionTypeAndDeletedFalse(
            UUID projectId, PredictionType predictionType, Pageable pageable);
}
