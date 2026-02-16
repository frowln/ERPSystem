package com.privod.platform.modules.dataExchange.repository;

import com.privod.platform.modules.dataExchange.domain.ExportFormat;
import com.privod.platform.modules.dataExchange.domain.ExportJob;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ExportJobRepository extends JpaRepository<ExportJob, UUID>,
        JpaSpecificationExecutor<ExportJob> {

    Page<ExportJob> findByEntityTypeAndDeletedFalse(String entityType, Pageable pageable);

    Page<ExportJob> findByFormatAndDeletedFalse(ExportFormat format, Pageable pageable);

    Page<ExportJob> findByProjectIdAndDeletedFalse(UUID projectId, Pageable pageable);

    Page<ExportJob> findByDeletedFalse(Pageable pageable);
}
