package com.privod.platform.modules.cde.repository;

import com.privod.platform.modules.cde.domain.ArchivePolicy;
import com.privod.platform.modules.cde.domain.DocumentClassification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ArchivePolicyRepository extends JpaRepository<ArchivePolicy, UUID> {

    Page<ArchivePolicy> findByOrganizationIdAndDeletedFalse(UUID orgId, Pageable pageable);

    List<ArchivePolicy> findByOrganizationIdAndEnabledTrueAndDeletedFalse(UUID orgId);

    Optional<ArchivePolicy> findByOrganizationIdAndClassificationAndDeletedFalse(
            UUID orgId, DocumentClassification classification);
}
