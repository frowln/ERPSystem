package com.privod.platform.modules.dataExchange.repository;

import com.privod.platform.modules.dataExchange.domain.ImportJob;
import com.privod.platform.modules.dataExchange.domain.ImportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ImportJobRepository extends JpaRepository<ImportJob, UUID>,
        JpaSpecificationExecutor<ImportJob> {

    Page<ImportJob> findByEntityTypeAndDeletedFalse(String entityType, Pageable pageable);

    Page<ImportJob> findByStatusAndDeletedFalse(ImportStatus status, Pageable pageable);

    Page<ImportJob> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<ImportJob> findByDeletedFalse(Pageable pageable);
}
