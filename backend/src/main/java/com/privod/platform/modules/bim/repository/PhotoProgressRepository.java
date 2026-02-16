package com.privod.platform.modules.bim.repository;

import com.privod.platform.modules.bim.domain.PhotoProgress;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PhotoProgressRepository extends JpaRepository<PhotoProgress, UUID> {

    Page<PhotoProgress> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<PhotoProgress> findByDeletedFalse(Pageable pageable);

    long countByProjectIdAndDeletedFalse(UUID projectId);
}
