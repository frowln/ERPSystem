package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.PhotoComparison;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PhotoComparisonRepository extends JpaRepository<PhotoComparison, UUID> {

    Page<PhotoComparison> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<PhotoComparison> findByDeletedFalse(Pageable pageable);
}
