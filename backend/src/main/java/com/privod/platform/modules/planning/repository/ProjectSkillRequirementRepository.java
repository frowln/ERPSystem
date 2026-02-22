package com.privod.platform.modules.planning.repository;

import com.privod.platform.modules.planning.domain.ProjectSkillRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectSkillRequirementRepository extends JpaRepository<ProjectSkillRequirement, UUID> {

    List<ProjectSkillRequirement> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId);

    List<ProjectSkillRequirement> findByOrganizationIdAndProjectIdAndIsMandatoryTrueAndDeletedFalse(
            UUID organizationId, UUID projectId);
}
