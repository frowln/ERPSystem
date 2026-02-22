package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.QualityGate;
import com.privod.platform.modules.quality.domain.QualityGateStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QualityGateRepository extends JpaRepository<QualityGate, UUID> {

    List<QualityGate> findByProjectIdAndDeletedFalseOrderByCreatedAtDesc(UUID projectId);

    List<QualityGate> findByWbsNodeIdAndDeletedFalse(UUID wbsNodeId);

    Optional<QualityGate> findByIdAndDeletedFalse(UUID id);

    List<QualityGate> findByWbsNodeIdAndStatusNotAndDeletedFalse(UUID wbsNodeId, QualityGateStatus excludeStatus);

    long countByProjectIdAndDeletedFalse(UUID projectId);

    long countByProjectIdAndStatusAndDeletedFalse(UUID projectId, QualityGateStatus status);
}
