package com.privod.platform.modules.closeout.repository;

import com.privod.platform.modules.closeout.domain.CommissioningSignOff;
import com.privod.platform.modules.closeout.domain.SignOffDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommissioningSignOffRepository extends JpaRepository<CommissioningSignOff, UUID>,
        JpaSpecificationExecutor<CommissioningSignOff> {

    List<CommissioningSignOff> findByChecklistIdAndDeletedFalseOrderByCreatedAtAsc(UUID checklistId);

    long countByChecklistIdAndDeletedFalse(UUID checklistId);

    long countByChecklistIdAndDecisionAndDeletedFalse(UUID checklistId, SignOffDecision decision);
}
