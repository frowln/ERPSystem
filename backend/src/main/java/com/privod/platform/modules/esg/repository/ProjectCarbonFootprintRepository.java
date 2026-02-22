package com.privod.platform.modules.esg.repository;

import com.privod.platform.modules.esg.domain.ProjectCarbonFootprint;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectCarbonFootprintRepository extends JpaRepository<ProjectCarbonFootprint, UUID> {

    @Query("SELECT pcf FROM ProjectCarbonFootprint pcf WHERE pcf.projectId = :projectId " +
            "AND pcf.deleted = false ORDER BY pcf.calculatedAt DESC")
    List<ProjectCarbonFootprint> findByProjectIdOrderByCalculatedAtDesc(@Param("projectId") UUID projectId);

    @Query("SELECT pcf FROM ProjectCarbonFootprint pcf WHERE pcf.projectId = :projectId " +
            "AND pcf.organizationId = :organizationId AND pcf.deleted = false " +
            "ORDER BY pcf.calculatedAt DESC")
    List<ProjectCarbonFootprint> findByProjectIdAndOrganizationIdOrderByCalculatedAtDesc(
            @Param("projectId") UUID projectId,
            @Param("organizationId") UUID organizationId);

    default Optional<ProjectCarbonFootprint> findLatestByProjectIdAndOrganizationId(UUID projectId, UUID organizationId) {
        List<ProjectCarbonFootprint> results = findByProjectIdAndOrganizationIdOrderByCalculatedAtDesc(projectId, organizationId);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    Page<ProjectCarbonFootprint> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    @Query("SELECT pcf FROM ProjectCarbonFootprint pcf WHERE pcf.organizationId = :organizationId " +
            "AND pcf.deleted = false AND pcf.projectId IN :projectIds " +
            "ORDER BY pcf.calculatedAt DESC")
    List<ProjectCarbonFootprint> findLatestByOrganizationIdAndProjectIds(
            @Param("organizationId") UUID organizationId,
            @Param("projectIds") List<UUID> projectIds);
}
