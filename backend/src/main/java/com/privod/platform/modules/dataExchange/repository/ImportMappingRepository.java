package com.privod.platform.modules.dataExchange.repository;

import com.privod.platform.modules.dataExchange.domain.ImportMapping;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ImportMappingRepository extends JpaRepository<ImportMapping, UUID> {

    Page<ImportMapping> findByEntityTypeAndDeletedFalse(String entityType, Pageable pageable);

    Page<ImportMapping> findByDeletedFalse(Pageable pageable);

    Optional<ImportMapping> findByEntityTypeAndIsDefaultTrueAndDeletedFalse(String entityType);

    List<ImportMapping> findByEntityTypeAndDeletedFalse(String entityType);
}
