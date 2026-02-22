package com.privod.platform.modules.quality.repository;

import com.privod.platform.modules.quality.domain.QualityGateTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface QualityGateTemplateRepository extends JpaRepository<QualityGateTemplate, UUID> {

    List<QualityGateTemplate> findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(UUID organizationId);

    Optional<QualityGateTemplate> findByIdAndDeletedFalse(UUID id);

    List<QualityGateTemplate> findByProjectTemplateIdAndDeletedFalse(UUID projectTemplateId);
}
