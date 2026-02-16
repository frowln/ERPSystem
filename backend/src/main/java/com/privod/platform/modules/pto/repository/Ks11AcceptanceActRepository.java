package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.Ks11AcceptanceAct;
import com.privod.platform.modules.pto.domain.Ks11Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface Ks11AcceptanceActRepository extends JpaRepository<Ks11AcceptanceAct, UUID>,
        JpaSpecificationExecutor<Ks11AcceptanceAct> {

    Page<Ks11AcceptanceAct> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<Ks11AcceptanceAct> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, Ks11Status status, Pageable pageable);

    Page<Ks11AcceptanceAct> findByDeletedFalse(Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
