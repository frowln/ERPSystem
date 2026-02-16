package com.privod.platform.modules.pmWorkflow.repository;

import com.privod.platform.modules.pmWorkflow.domain.SubmittalPackage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubmittalPackageRepository extends JpaRepository<SubmittalPackage, UUID> {

    Page<SubmittalPackage> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<SubmittalPackage> findByProjectIdAndDeletedFalse(UUID projectId);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
