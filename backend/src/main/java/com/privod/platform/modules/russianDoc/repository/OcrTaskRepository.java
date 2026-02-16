package com.privod.platform.modules.russianDoc.repository;

import com.privod.platform.modules.russianDoc.domain.OcrTask;
import com.privod.platform.modules.russianDoc.domain.OcrTaskStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OcrTaskRepository extends JpaRepository<OcrTask, UUID> {

    Page<OcrTask> findByDeletedFalse(Pageable pageable);

    Page<OcrTask> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    List<OcrTask> findByStatusAndDeletedFalse(OcrTaskStatus status);

    // --- Tenant-scoped variants ---

    Page<OcrTask> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<OcrTask> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId, Pageable pageable);

    List<OcrTask> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, OcrTaskStatus status);

    Optional<OcrTask> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);
}
