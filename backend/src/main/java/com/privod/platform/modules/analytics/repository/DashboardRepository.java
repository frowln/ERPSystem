package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.Dashboard;
import com.privod.platform.modules.analytics.domain.DashboardType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DashboardRepository extends JpaRepository<Dashboard, UUID>, JpaSpecificationExecutor<Dashboard> {

    Optional<Dashboard> findByCodeAndDeletedFalse(String code);

    Page<Dashboard> findByOwnerIdAndDeletedFalse(UUID ownerId, Pageable pageable);

    List<Dashboard> findByDashboardTypeAndDeletedFalse(DashboardType dashboardType);

    @Query("SELECT d FROM Dashboard d WHERE d.deleted = false AND " +
            "(d.ownerId = :ownerId OR d.isPublic = true OR d.dashboardType = 'SYSTEM')")
    Page<Dashboard> findAccessibleDashboards(@Param("ownerId") UUID ownerId, Pageable pageable);

    @Query("SELECT d FROM Dashboard d WHERE d.deleted = false AND d.dashboardType = 'SYSTEM'")
    List<Dashboard> findSystemDashboards();

    @Query("SELECT d FROM Dashboard d WHERE d.deleted = false AND d.isDefault = true AND d.dashboardType = 'SYSTEM'")
    Optional<Dashboard> findDefaultSystemDashboard();

    boolean existsByCodeAndDeletedFalse(String code);
}
