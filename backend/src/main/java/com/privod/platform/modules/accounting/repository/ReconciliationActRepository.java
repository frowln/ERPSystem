package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.ReconciliationAct;
import com.privod.platform.modules.accounting.domain.ReconciliationActStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReconciliationActRepository extends JpaRepository<ReconciliationAct, UUID> {

    Page<ReconciliationAct> findByDeletedFalse(Pageable pageable);

    Page<ReconciliationAct> findByCounterpartyIdAndDeletedFalse(UUID counterpartyId, Pageable pageable);

    List<ReconciliationAct> findByStatusAndDeletedFalse(ReconciliationActStatus status);
}
