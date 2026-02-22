package com.privod.platform.modules.kep.repository;

import com.privod.platform.modules.kep.domain.MchDDocument;
import com.privod.platform.modules.kep.domain.MchDStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MchDRepository extends JpaRepository<MchDDocument, UUID>,
        JpaSpecificationExecutor<MchDDocument> {

    Page<MchDDocument> findByOrganizationIdAndDeletedFalse(UUID orgId, Pageable pageable);

    Optional<MchDDocument> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID orgId);

    List<MchDDocument> findByRepresentativeUserIdAndOrganizationIdAndStatusAndDeletedFalse(
            UUID userId, UUID orgId, MchDStatus status);

    List<MchDDocument> findByOrganizationIdAndStatusAndValidToBeforeAndDeletedFalse(
            UUID orgId, MchDStatus status, Instant now);

    long countByOrganizationIdAndStatusAndDeletedFalse(UUID orgId, MchDStatus status);
}
