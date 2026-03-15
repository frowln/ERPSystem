package com.privod.platform.modules.project.repository;

import com.privod.platform.modules.project.domain.ProjectTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ProjectTemplateRepository extends JpaRepository<ProjectTemplate, UUID> {

    @Query("SELECT t FROM ProjectTemplate t WHERE t.deleted = false " +
            "AND (t.organizationId IS NULL OR t.organizationId = :orgId)")
    List<ProjectTemplate> findAvailable(@Param("orgId") UUID organizationId);

    List<ProjectTemplate> findByDeletedFalse();

    List<ProjectTemplate> findByTemplateTypeAndDeletedFalse(String templateType);

    @Query("SELECT t FROM ProjectTemplate t WHERE t.deleted = false " +
            "AND t.templateType = :type AND (t.organizationId IS NULL OR t.organizationId = :orgId)")
    List<ProjectTemplate> findByTypeAvailable(@Param("type") String templateType,
                                               @Param("orgId") UUID organizationId);
}
