package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.WorkPermit;
import com.privod.platform.modules.pto.domain.WorkPermitStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface WorkPermitRepository extends JpaRepository<WorkPermit, UUID>, JpaSpecificationExecutor<WorkPermit> {

    Page<WorkPermit> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<WorkPermit> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, WorkPermitStatus status);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
