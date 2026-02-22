package com.privod.platform.modules.gpsTimesheet.repository;

import com.privod.platform.modules.gpsTimesheet.domain.SiteGeofence;
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
public interface SiteGeofenceRepository extends JpaRepository<SiteGeofence, UUID> {

    Optional<SiteGeofence> findByIdAndOrganizationIdAndDeletedFalse(UUID id, UUID organizationId);

    Page<SiteGeofence> findByOrganizationIdAndDeletedFalse(UUID organizationId, Pageable pageable);

    Page<SiteGeofence> findByOrganizationIdAndProjectIdAndDeletedFalse(UUID organizationId, UUID projectId, Pageable pageable);

    @Query("SELECT g FROM SiteGeofence g WHERE g.organizationId = :orgId AND g.isActive = true AND g.deleted = false")
    List<SiteGeofence> findActiveByOrganizationId(@Param("orgId") UUID organizationId);

    @Query("SELECT g FROM SiteGeofence g WHERE g.organizationId = :orgId AND g.projectId = :projectId " +
            "AND g.isActive = true AND g.deleted = false")
    List<SiteGeofence> findActiveByOrganizationIdAndProjectId(@Param("orgId") UUID organizationId,
                                                               @Param("projectId") UUID projectId);
}
