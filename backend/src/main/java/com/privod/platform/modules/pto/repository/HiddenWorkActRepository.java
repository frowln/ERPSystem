package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.HiddenWorkAct;
import com.privod.platform.modules.pto.domain.HiddenWorkActStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface HiddenWorkActRepository extends JpaRepository<HiddenWorkAct, UUID>,
        JpaSpecificationExecutor<HiddenWorkAct> {

    Page<HiddenWorkAct> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<HiddenWorkAct> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, HiddenWorkActStatus status, Pageable pageable);

    Page<HiddenWorkAct> findByDeletedFalse(Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
