package com.privod.platform.modules.closeout.repository;

import com.privod.platform.modules.closeout.domain.ChecklistStatus;
import com.privod.platform.modules.closeout.domain.CommissioningChecklist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CommissioningChecklistRepository extends JpaRepository<CommissioningChecklist, UUID>,
        JpaSpecificationExecutor<CommissioningChecklist> {

    Page<CommissioningChecklist> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<CommissioningChecklist> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, ChecklistStatus status, Pageable pageable);

    Page<CommissioningChecklist> findByDeletedFalse(Pageable pageable);
}
