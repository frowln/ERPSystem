package com.privod.platform.modules.siteAssessment.repository;

import com.privod.platform.modules.siteAssessment.domain.SiteAssessment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SiteAssessmentRepository extends JpaRepository<SiteAssessment, UUID> {

    Page<SiteAssessment> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<SiteAssessment> findByProjectIdAndOrganizationIdAndDeletedFalse(UUID projectId, UUID organizationId, Pageable pageable);

    Optional<SiteAssessment> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    List<SiteAssessment> findByProjectIdAndDeletedFalseOrderByAssessmentDateDesc(UUID projectId);
}
