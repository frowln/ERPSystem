package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.LabTest;
import com.privod.platform.modules.pto.domain.LabTestConclusion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LabTestRepository extends JpaRepository<LabTest, UUID>, JpaSpecificationExecutor<LabTest> {

    Page<LabTest> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<LabTest> findByProjectIdAndConclusionAndDeletedFalse(UUID projectId, LabTestConclusion conclusion);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
