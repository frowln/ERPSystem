package com.privod.platform.modules.mobile.repository;

import com.privod.platform.modules.mobile.domain.PhotoCapture;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PhotoCaptureRepository extends JpaRepository<PhotoCapture, UUID> {

    Optional<PhotoCapture> findByIdAndDeletedFalse(UUID id);

    Page<PhotoCapture> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<PhotoCapture> findByUserIdAndDeletedFalse(UUID userId, Pageable pageable);

    Page<PhotoCapture> findByEntityTypeAndEntityIdAndDeletedFalse(String entityType, UUID entityId, Pageable pageable);
}
