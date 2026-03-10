package com.privod.platform.modules.estimate.repository;

import com.privod.platform.modules.estimate.domain.ImportHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ImportHistoryRepository extends JpaRepository<ImportHistory, UUID> {

    List<ImportHistory> findByOrganizationIdAndDeletedFalseOrderByImportDateDesc(UUID organizationId);
}
