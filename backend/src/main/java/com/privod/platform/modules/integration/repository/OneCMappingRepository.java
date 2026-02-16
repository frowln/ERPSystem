package com.privod.platform.modules.integration.repository;

import com.privod.platform.modules.integration.domain.OneCMapping;
import com.privod.platform.modules.integration.domain.OneCMappingSyncStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OneCMappingRepository extends JpaRepository<OneCMapping, UUID> {

    Page<OneCMapping> findByEntityTypeAndDeletedFalse(String entityType, Pageable pageable);

    Optional<OneCMapping> findByPrivodIdAndEntityTypeAndDeletedFalse(UUID privodId, String entityType);

    Optional<OneCMapping> findByOneCIdAndEntityTypeAndDeletedFalse(String oneCId, String entityType);

    List<OneCMapping> findBySyncStatusAndDeletedFalse(OneCMappingSyncStatus syncStatus);

    Page<OneCMapping> findByDeletedFalse(Pageable pageable);
}
