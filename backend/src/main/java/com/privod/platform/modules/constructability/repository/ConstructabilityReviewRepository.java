package com.privod.platform.modules.constructability.repository;

import com.privod.platform.modules.constructability.domain.ConstructabilityReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ConstructabilityReviewRepository extends JpaRepository<ConstructabilityReview, UUID> {

    Page<ConstructabilityReview> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<ConstructabilityReview> findByProjectIdAndOrganizationIdAndDeletedFalse(UUID projectId, UUID organizationId, Pageable pageable);

    Optional<ConstructabilityReview> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);
}
