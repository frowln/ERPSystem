package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.DashboardWidget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DashboardWidgetRepository extends JpaRepository<DashboardWidget, UUID> {

    List<DashboardWidget> findByDashboardIdAndDeletedFalseOrderByPositionYAscPositionXAsc(UUID dashboardId);

    void deleteByDashboardId(UUID dashboardId);

    long countByDashboardIdAndDeletedFalse(UUID dashboardId);
}
