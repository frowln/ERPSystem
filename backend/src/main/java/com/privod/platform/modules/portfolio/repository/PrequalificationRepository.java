package com.privod.platform.modules.portfolio.repository;

import com.privod.platform.modules.portfolio.domain.Prequalification;
import com.privod.platform.modules.portfolio.domain.PrequalificationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PrequalificationRepository extends JpaRepository<Prequalification, UUID>, JpaSpecificationExecutor<Prequalification> {

    Page<Prequalification> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<Prequalification> findByOrganizationIdAndStatusAndDeletedFalse(UUID organizationId,
                                                                        PrequalificationStatus status,
                                                                        Pageable pageable);

    Optional<Prequalification> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<Prequalification> findByStatusAndDeletedFalse(PrequalificationStatus status, Pageable pageable);

    long countByStatusAndDeletedFalse(PrequalificationStatus status);
}
