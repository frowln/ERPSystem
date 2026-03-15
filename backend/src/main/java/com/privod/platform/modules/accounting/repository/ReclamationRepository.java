package com.privod.platform.modules.accounting.repository;

import com.privod.platform.modules.accounting.domain.Reclamation;
import com.privod.platform.modules.accounting.domain.ReclamationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReclamationRepository extends JpaRepository<Reclamation, UUID> {

    Page<Reclamation> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<Reclamation> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId, Pageable pageable);

    Page<Reclamation> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, ReclamationStatus status, Pageable pageable);

    Optional<Reclamation> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    long countByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId, ReclamationStatus status);
}
