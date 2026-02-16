package com.privod.platform.modules.analytics;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.analytics.domain.Dashboard;
import com.privod.platform.modules.analytics.domain.DashboardType;
import com.privod.platform.modules.analytics.domain.DashboardWidget;
import com.privod.platform.modules.analytics.domain.WidgetType;
import com.privod.platform.modules.analytics.repository.DashboardRepository;
import com.privod.platform.modules.analytics.repository.DashboardWidgetRepository;
import com.privod.platform.modules.analytics.service.DashboardService;
import com.privod.platform.modules.analytics.web.dto.CreateDashboardRequest;
import com.privod.platform.modules.analytics.web.dto.CreateWidgetRequest;
import com.privod.platform.modules.analytics.web.dto.DashboardResponse;
import com.privod.platform.modules.analytics.web.dto.DashboardWidgetResponse;
import com.privod.platform.modules.analytics.web.dto.UpdateDashboardRequest;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    @Mock
    private DashboardRepository dashboardRepository;

    @Mock
    private DashboardWidgetRepository widgetRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DashboardService dashboardService;

    private UUID dashboardId;
    private Dashboard testDashboard;

    @BeforeEach
    void setUp() {
        dashboardId = UUID.randomUUID();
        testDashboard = Dashboard.builder()
                .code("test_dashboard")
                .name("Test Dashboard")
                .description("A test dashboard")
                .dashboardType(DashboardType.PERSONAL)
                .ownerId(UUID.randomUUID())
                .layoutConfig("{\"columns\": 12}")
                .isDefault(false)
                .isPublic(false)
                .build();
        testDashboard.setId(dashboardId);
        testDashboard.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Dashboard")
    class CreateDashboardTests {

        @Test
        @DisplayName("Should create dashboard with PERSONAL type by default")
        void create_Success() {
            CreateDashboardRequest request = new CreateDashboardRequest(
                    "new_dashboard", "New Dashboard", "Description",
                    UUID.randomUUID(), null, null, null, null);

            when(dashboardRepository.existsByCodeAndDeletedFalse("new_dashboard")).thenReturn(false);
            when(dashboardRepository.save(any(Dashboard.class))).thenAnswer(invocation -> {
                Dashboard d = invocation.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            DashboardResponse response = dashboardService.create(request);

            assertThat(response.code()).isEqualTo("new_dashboard");
            assertThat(response.name()).isEqualTo("New Dashboard");
            assertThat(response.dashboardType()).isEqualTo(DashboardType.PERSONAL);
            verify(auditService).logCreate(eq("Dashboard"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject duplicate dashboard code")
        void create_DuplicateCode() {
            CreateDashboardRequest request = new CreateDashboardRequest(
                    "existing_code", "Dashboard", null,
                    null, null, null, null, null);

            when(dashboardRepository.existsByCodeAndDeletedFalse("existing_code")).thenReturn(true);

            assertThatThrownBy(() -> dashboardService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("Update Dashboard")
    class UpdateDashboardTests {

        @Test
        @DisplayName("Should update dashboard name and description")
        void update_Success() {
            when(dashboardRepository.findById(dashboardId)).thenReturn(Optional.of(testDashboard));
            when(dashboardRepository.save(any(Dashboard.class))).thenReturn(testDashboard);

            UpdateDashboardRequest request = new UpdateDashboardRequest(
                    "Updated Name", "Updated Description",
                    null, null, null, null, null);

            DashboardResponse response = dashboardService.update(dashboardId, request);

            assertThat(response).isNotNull();
            verify(auditService).logUpdate("Dashboard", dashboardId, "multiple", null, null);
        }

        @Test
        @DisplayName("Should throw when dashboard not found for update")
        void update_NotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(dashboardRepository.findById(nonExistent)).thenReturn(Optional.empty());

            UpdateDashboardRequest request = new UpdateDashboardRequest(
                    "Name", null, null, null, null, null, null);

            assertThatThrownBy(() -> dashboardService.update(nonExistent, request))
                    .isInstanceOf(EntityNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("Dashboard Widgets")
    class WidgetTests {

        @Test
        @DisplayName("Should add widget to dashboard")
        void addWidget_Success() {
            when(dashboardRepository.findById(dashboardId)).thenReturn(Optional.of(testDashboard));
            when(widgetRepository.save(any(DashboardWidget.class))).thenAnswer(invocation -> {
                DashboardWidget w = invocation.getArgument(0);
                w.setId(UUID.randomUUID());
                w.setCreatedAt(Instant.now());
                return w;
            });

            CreateWidgetRequest request = new CreateWidgetRequest(
                    WidgetType.BAR_CHART, "Revenue Chart",
                    "finance.revenue", null, 0, 0, 6, 4, 300);

            DashboardWidgetResponse response = dashboardService.addWidget(dashboardId, request);

            assertThat(response.widgetType()).isEqualTo(WidgetType.BAR_CHART);
            assertThat(response.title()).isEqualTo("Revenue Chart");
            assertThat(response.dataSource()).isEqualTo("finance.revenue");
            verify(auditService).logCreate(eq("DashboardWidget"), any(UUID.class));
        }

        @Test
        @DisplayName("Should remove widget from dashboard")
        void removeWidget_Success() {
            UUID widgetId = UUID.randomUUID();
            DashboardWidget widget = DashboardWidget.builder()
                    .dashboardId(dashboardId)
                    .widgetType(WidgetType.KPI_CARD)
                    .title("Test Widget")
                    .dataSource("test.data")
                    .build();
            widget.setId(widgetId);

            when(dashboardRepository.findById(dashboardId)).thenReturn(Optional.of(testDashboard));
            when(widgetRepository.findById(widgetId)).thenReturn(Optional.of(widget));

            dashboardService.removeWidget(dashboardId, widgetId);

            assertThat(widget.isDeleted()).isTrue();
            verify(widgetRepository).save(widget);
            verify(auditService).logDelete("DashboardWidget", widgetId);
        }

        @Test
        @DisplayName("Should reject removing widget that belongs to another dashboard")
        void removeWidget_WrongDashboard() {
            UUID widgetId = UUID.randomUUID();
            DashboardWidget widget = DashboardWidget.builder()
                    .dashboardId(UUID.randomUUID()) // Different dashboard
                    .widgetType(WidgetType.TABLE)
                    .title("Other Widget")
                    .dataSource("other.data")
                    .build();
            widget.setId(widgetId);

            when(dashboardRepository.findById(dashboardId)).thenReturn(Optional.of(testDashboard));
            when(widgetRepository.findById(widgetId)).thenReturn(Optional.of(widget));

            assertThatThrownBy(() -> dashboardService.removeWidget(dashboardId, widgetId))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("не принадлежит");
        }
    }

    @Nested
    @DisplayName("Clone Dashboard")
    class CloneDashboardTests {

        @Test
        @DisplayName("Should clone dashboard with all widgets")
        void clone_Success() {
            DashboardWidget sourceWidget = DashboardWidget.builder()
                    .dashboardId(dashboardId)
                    .widgetType(WidgetType.PIE_CHART)
                    .title("Status Chart")
                    .dataSource("projects.statusCount")
                    .positionX(0)
                    .positionY(0)
                    .width(6)
                    .height(4)
                    .build();
            sourceWidget.setId(UUID.randomUUID());

            when(dashboardRepository.findById(dashboardId)).thenReturn(Optional.of(testDashboard));
            when(dashboardRepository.existsByCodeAndDeletedFalse("cloned_dashboard")).thenReturn(false);
            when(dashboardRepository.save(any(Dashboard.class))).thenAnswer(invocation -> {
                Dashboard d = invocation.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });
            when(widgetRepository.findByDashboardIdAndDeletedFalseOrderByPositionYAscPositionXAsc(dashboardId))
                    .thenReturn(List.of(sourceWidget));
            when(widgetRepository.save(any(DashboardWidget.class))).thenAnswer(invocation -> {
                DashboardWidget w = invocation.getArgument(0);
                w.setId(UUID.randomUUID());
                return w;
            });

            UUID ownerId = UUID.randomUUID();
            DashboardResponse response = dashboardService.cloneDashboard(
                    dashboardId, "cloned_dashboard", "Cloned Dashboard", ownerId);

            assertThat(response.code()).isEqualTo("cloned_dashboard");
            assertThat(response.dashboardType()).isEqualTo(DashboardType.PERSONAL);
            verify(auditService).logCreate(eq("Dashboard"), any(UUID.class));
        }
    }

    @Test
    @DisplayName("Should get system dashboards")
    void getSystemDashboards_Success() {
        Dashboard systemDashboard = Dashboard.builder()
                .code("executive_dashboard")
                .name("Executive Dashboard")
                .dashboardType(DashboardType.SYSTEM)
                .isPublic(true)
                .build();
        systemDashboard.setId(UUID.randomUUID());
        systemDashboard.setCreatedAt(Instant.now());

        when(dashboardRepository.findSystemDashboards()).thenReturn(List.of(systemDashboard));

        List<DashboardResponse> result = dashboardService.getSystemDashboards();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).code()).isEqualTo("executive_dashboard");
        assertThat(result.get(0).dashboardType()).isEqualTo(DashboardType.SYSTEM);
    }

    @Test
    @DisplayName("Should soft delete dashboard")
    void delete_Success() {
        when(dashboardRepository.findById(dashboardId)).thenReturn(Optional.of(testDashboard));
        when(dashboardRepository.save(any(Dashboard.class))).thenReturn(testDashboard);

        dashboardService.delete(dashboardId);

        assertThat(testDashboard.isDeleted()).isTrue();
        verify(dashboardRepository).save(testDashboard);
        verify(auditService).logDelete("Dashboard", dashboardId);
    }
}
