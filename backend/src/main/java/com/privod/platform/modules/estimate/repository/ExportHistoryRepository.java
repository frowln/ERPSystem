package com.privod.platform.modules.estimate.repository;

import com.privod.platform.modules.estimate.domain.ExportHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExportHistoryRepository extends JpaRepository<ExportHistory, UUID> {

    List<ExportHistory> findByOrganizationIdAndDeletedFalseOrderByExportDateDesc(UUID organizationId);
}
