package com.privod.platform.modules.planning.repository;

import com.privod.platform.modules.planning.domain.EmployeeSkill;
import com.privod.platform.modules.planning.domain.SkillCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EmployeeSkillRepository extends JpaRepository<EmployeeSkill, UUID> {

    List<EmployeeSkill> findByOrganizationIdAndEmployeeIdAndDeletedFalse(UUID organizationId, UUID employeeId);

    List<EmployeeSkill> findByOrganizationIdAndSkillNameAndDeletedFalse(UUID organizationId, String skillName);

    List<EmployeeSkill> findByOrganizationIdAndSkillCategoryAndDeletedFalse(UUID organizationId, SkillCategory skillCategory);

    List<EmployeeSkill> findByOrganizationIdAndSkillNameAndProficiencyLevelGreaterThanEqualAndDeletedFalse(
            UUID organizationId, String skillName, int proficiencyLevel);

    List<EmployeeSkill> findByOrganizationIdAndDeletedFalse(UUID organizationId);
}
