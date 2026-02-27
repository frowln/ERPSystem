package com.privod.platform.modules.prequalification.repository;

import com.privod.platform.modules.prequalification.domain.Prequalification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractorPrequalificationRepository extends JpaRepository<Prequalification, UUID> {
    Page<Prequalification> findByOrganizationIdAndDeletedFalse(UUID orgId, Pageable pageable);
    Optional<Prequalification> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID orgId);
}
