package com.privod.platform.modules.analytics.repository;

import com.privod.platform.modules.analytics.domain.BiWidget;
import com.privod.platform.modules.analytics.domain.BiWidgetType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface BiWidgetRepository extends JpaRepository<BiWidget, UUID>, JpaSpecificationExecutor<BiWidget> {

    List<BiWidget> findByDashboardIdAndDeletedFalseOrderByCreatedAtAsc(UUID dashboardId);

    List<BiWidget> findByDashboardIdAndWidgetTypeAndDeletedFalse(UUID dashboardId, BiWidgetType widgetType);

    void deleteByDashboardId(UUID dashboardId);
}
