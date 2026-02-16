package com.privod.platform.modules.contractExt.repository;

import com.privod.platform.modules.contractExt.domain.Tolerance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ToleranceRepository extends JpaRepository<Tolerance, UUID> {

    Page<Tolerance> findByDeletedFalse(Pageable pageable);

    Page<Tolerance> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<Tolerance> findByProjectIdAndDeletedFalseOrderByWorkTypeAsc(UUID projectId);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
