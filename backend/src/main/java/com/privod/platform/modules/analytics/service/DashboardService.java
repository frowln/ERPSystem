package com.privod.platform.modules.analytics.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.analytics.domain.Dashboard;
import com.privod.platform.modules.analytics.domain.DashboardType;
import com.privod.platform.modules.analytics.domain.DashboardWidget;
import com.privod.platform.modules.analytics.repository.DashboardRepository;
import com.privod.platform.modules.analytics.repository.DashboardWidgetRepository;
import com.privod.platform.modules.analytics.web.dto.CreateDashboardRequest;
import com.privod.platform.modules.analytics.web.dto.CreateWidgetRequest;
import com.privod.platform.modules.analytics.web.dto.DashboardResponse;
import com.privod.platform.modules.analytics.web.dto.DashboardWidgetResponse;
import com.privod.platform.modules.analytics.web.dto.UpdateDashboardRequest;
import com.privod.platform.modules.analytics.web.dto.UpdateLayoutRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final DashboardRepository dashboardRepository;
    private final DashboardWidgetRepository widgetRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public DashboardResponse findById(UUID id) {
        Dashboard dashboard = getDashboardOrThrow(id);
        return DashboardResponse.fromEntity(dashboard);
    }

    @Transactional(readOnly = true)
    public Page<DashboardResponse> findAll(Pageable pageable) {
        return dashboardRepository.findAll(pageable)
                .map(DashboardResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<DashboardResponse> getMyDashboards(UUID ownerId, Pageable pageable) {
        return dashboardRepository.findByOwnerIdAndDeletedFalse(ownerId, pageable)
                .map(DashboardResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<DashboardResponse> getAccessibleDashboards(UUID ownerId, Pageable pageable) {
        return dashboardRepository.findAccessibleDashboards(ownerId, pageable)
                .map(DashboardResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<DashboardResponse> getSystemDashboards() {
        return dashboardRepository.findSystemDashboards()
                .stream()
                .map(DashboardResponse::fromEntity)
                .toList();
    }

    @Transactional
    public DashboardResponse create(CreateDashboardRequest request) {
        if (dashboardRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("Панель с кодом '" + request.code() + "' уже существует");
        }

        Dashboard dashboard = Dashboard.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .ownerId(request.ownerId())
                .dashboardType(request.dashboardType() != null ? request.dashboardType() : DashboardType.PERSONAL)
                .layoutConfig(request.layoutConfig() != null ? request.layoutConfig() : "{}")
                .isDefault(request.isDefault() != null && request.isDefault())
                .isPublic(request.isPublic() != null && request.isPublic())
                .build();

        dashboard = dashboardRepository.save(dashboard);
        auditService.logCreate("Dashboard", dashboard.getId());

        log.info("Dashboard created: {} - {} ({})", dashboard.getCode(), dashboard.getName(), dashboard.getId());
        return DashboardResponse.fromEntity(dashboard);
    }

    @Transactional
    public DashboardResponse update(UUID id, UpdateDashboardRequest request) {
        Dashboard dashboard = getDashboardOrThrow(id);

        if (request.name() != null) {
            dashboard.setName(request.name());
        }
        if (request.description() != null) {
            dashboard.setDescription(request.description());
        }
        if (request.ownerId() != null) {
            dashboard.setOwnerId(request.ownerId());
        }
        if (request.dashboardType() != null) {
            dashboard.setDashboardType(request.dashboardType());
        }
        if (request.layoutConfig() != null) {
            dashboard.setLayoutConfig(request.layoutConfig());
        }
        if (request.isDefault() != null) {
            dashboard.setDefault(request.isDefault());
        }
        if (request.isPublic() != null) {
            dashboard.setPublic(request.isPublic());
        }

        dashboard = dashboardRepository.save(dashboard);
        auditService.logUpdate("Dashboard", dashboard.getId(), "multiple", null, null);

        log.info("Dashboard updated: {} ({})", dashboard.getCode(), dashboard.getId());
        return DashboardResponse.fromEntity(dashboard);
    }

    @Transactional
    public DashboardResponse updateLayout(UUID id, UpdateLayoutRequest request) {
        Dashboard dashboard = getDashboardOrThrow(id);
        String oldLayout = dashboard.getLayoutConfig();
        dashboard.setLayoutConfig(request.layoutConfig());
        dashboard = dashboardRepository.save(dashboard);
        auditService.logUpdate("Dashboard", dashboard.getId(), "layoutConfig", oldLayout, request.layoutConfig());

        log.info("Dashboard layout updated: {} ({})", dashboard.getCode(), dashboard.getId());
        return DashboardResponse.fromEntity(dashboard);
    }

    @Transactional
    public DashboardResponse cloneDashboard(UUID sourceId, String newCode, String newName, UUID ownerId) {
        Dashboard source = getDashboardOrThrow(sourceId);

        if (dashboardRepository.existsByCodeAndDeletedFalse(newCode)) {
            throw new IllegalArgumentException("Панель с кодом '" + newCode + "' уже существует");
        }

        Dashboard cloned = Dashboard.builder()
                .code(newCode)
                .name(newName)
                .description(source.getDescription())
                .ownerId(ownerId)
                .dashboardType(DashboardType.PERSONAL)
                .layoutConfig(source.getLayoutConfig())
                .isDefault(false)
                .isPublic(false)
                .build();

        cloned = dashboardRepository.save(cloned);

        List<DashboardWidget> sourceWidgets =
                widgetRepository.findByDashboardIdAndDeletedFalseOrderByPositionYAscPositionXAsc(sourceId);
        for (DashboardWidget sw : sourceWidgets) {
            DashboardWidget clonedWidget = DashboardWidget.builder()
                    .dashboardId(cloned.getId())
                    .widgetType(sw.getWidgetType())
                    .title(sw.getTitle())
                    .dataSource(sw.getDataSource())
                    .configJson(sw.getConfigJson())
                    .positionX(sw.getPositionX())
                    .positionY(sw.getPositionY())
                    .width(sw.getWidth())
                    .height(sw.getHeight())
                    .refreshIntervalSeconds(sw.getRefreshIntervalSeconds())
                    .build();
            widgetRepository.save(clonedWidget);
        }

        auditService.logCreate("Dashboard", cloned.getId());
        log.info("Dashboard cloned from {} to {} ({})", sourceId, cloned.getCode(), cloned.getId());
        return DashboardResponse.fromEntity(cloned);
    }

    @Transactional
    public void delete(UUID id) {
        Dashboard dashboard = getDashboardOrThrow(id);
        dashboard.softDelete();
        dashboardRepository.save(dashboard);
        auditService.logDelete("Dashboard", id);
        log.info("Dashboard soft-deleted: {} ({})", dashboard.getCode(), id);
    }

    // --- Widget management ---

    @Transactional(readOnly = true)
    public List<DashboardWidgetResponse> getWidgets(UUID dashboardId) {
        getDashboardOrThrow(dashboardId);
        return widgetRepository.findByDashboardIdAndDeletedFalseOrderByPositionYAscPositionXAsc(dashboardId)
                .stream()
                .map(DashboardWidgetResponse::fromEntity)
                .toList();
    }

    @Transactional
    public DashboardWidgetResponse addWidget(UUID dashboardId, CreateWidgetRequest request) {
        getDashboardOrThrow(dashboardId);

        DashboardWidget widget = DashboardWidget.builder()
                .dashboardId(dashboardId)
                .widgetType(request.widgetType())
                .title(request.title())
                .dataSource(request.dataSource())
                .configJson(request.configJson() != null ? request.configJson() : "{}")
                .positionX(request.positionX() != null ? request.positionX() : 0)
                .positionY(request.positionY() != null ? request.positionY() : 0)
                .width(request.width() != null ? request.width() : 4)
                .height(request.height() != null ? request.height() : 3)
                .refreshIntervalSeconds(request.refreshIntervalSeconds() != null ? request.refreshIntervalSeconds() : 300)
                .build();

        widget = widgetRepository.save(widget);
        auditService.logCreate("DashboardWidget", widget.getId());

        log.info("Widget added to dashboard {}: {} ({})", dashboardId, widget.getTitle(), widget.getId());
        return DashboardWidgetResponse.fromEntity(widget);
    }

    @Transactional
    public void removeWidget(UUID dashboardId, UUID widgetId) {
        getDashboardOrThrow(dashboardId);

        DashboardWidget widget = widgetRepository.findById(widgetId)
                .orElseThrow(() -> new EntityNotFoundException("Виджет не найден: " + widgetId));

        if (!widget.getDashboardId().equals(dashboardId)) {
            throw new IllegalArgumentException("Виджет не принадлежит указанной панели");
        }

        widget.softDelete();
        widgetRepository.save(widget);
        auditService.logDelete("DashboardWidget", widgetId);

        log.info("Widget removed from dashboard {}: widgetId={}", dashboardId, widgetId);
    }

    private Dashboard getDashboardOrThrow(UUID id) {
        return dashboardRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Панель не найдена: " + id));
    }
}
