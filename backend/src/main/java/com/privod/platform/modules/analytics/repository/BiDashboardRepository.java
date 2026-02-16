package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.BiDashboard;
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
public interface BiDashboardRepository extends JpaRepository<BiDashboard, UUID>, JpaSpecificationExecutor<BiDashboard> {

    Page<BiDashboard> findByOwnerIdAndDeletedFalse(UUID ownerId, Pageable pageable);

    List<BiDashboard> findByIsSharedTrueAndDeletedFalse();

    @Query("SELECT d FROM BiDashboard d WHERE d.deleted = false AND " +
            "(d.ownerId = :ownerId OR d.isShared = true) " +
            "ORDER BY d.createdAt DESC")
    Page<BiDashboard> findAccessibleDashboards(@Param("ownerId") UUID ownerId, Pageable pageable);

    @Query("SELECT d FROM BiDashboard d WHERE d.deleted = false AND d.isDefault = true")
    Optional<BiDashboard> findDefaultDashboard();
}
