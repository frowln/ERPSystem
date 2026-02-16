package com.privod.platform.modules.pto.repository;

import com.privod.platform.modules.pto.domain.Submittal;
import com.privod.platform.modules.pto.domain.SubmittalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface SubmittalRepository extends JpaRepository<Submittal, UUID>, JpaSpecificationExecutor<Submittal> {

    Page<Submittal> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<Submittal> findByProjectIdAndStatusAndDeletedFalse(UUID projectId, SubmittalStatus status);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
