package com.privod.platform.modules.isup.repository;

import com.privod.platform.modules.isup.domain.IsupProjectMapping;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IsupProjectMappingRepository extends JpaRepository<IsupProjectMapping, UUID> {

    Page<IsupProjectMapping> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Optional<IsupProjectMapping> findByPrivodProjectIdAndDeletedFalse(UUID privodProjectId);

    List<IsupProjectMapping> findByOrganizationIdAndSyncEnabledAndDeletedFalse(UUID organizationId, boolean syncEnabled);

    long countByOrganizationIdAndDeletedFalse(UUID organizationId);

    long countByOrganizationIdAndSyncEnabledAndDeletedFalse(UUID organizationId, boolean syncEnabled);
}
