package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.QualityChecklist;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface QualityChecklistRepository extends JpaRepository<QualityChecklist, UUID> {

    Page<QualityChecklist> findByDeletedFalse(Pageable pageable);

    Page<QualityChecklist> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(code, 5) AS BIGINT)), 0) + 1 FROM quality_checklists", nativeQuery = true)
    long getNextNumberSequence();
}
