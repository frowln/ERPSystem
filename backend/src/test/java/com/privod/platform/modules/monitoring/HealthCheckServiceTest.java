package com.privod.platform.modules.monitoring;

import com.privod.platform.modules.monitoring.domain.HealthComponent;
import com.privod.platform.modules.monitoring.domain.HealthStatus;
import com.privod.platform.modules.monitoring.domain.SystemHealthCheck;
import com.privod.platform.modules.monitoring.repository.SystemHealthCheckRepository;
import com.privod.platform.modules.monitoring.service.HealthCheckService;
import com.privod.platform.modules.monitoring.web.dto.HealthCheckResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HealthCheckServiceTest {

    @Mock
    private SystemHealthCheckRepository healthCheckRepository;

    @Mock
    private DataSource dataSource;

    @Mock
    private Connection connection;

    @InjectMocks
    private HealthCheckService healthCheckService;

    @Nested
    @DisplayName("Check Component")
    class CheckComponentTests {

        @Test
        @DisplayName("Should return HEALTHY when database is reachable")
        void checkComponent_DatabaseHealthy() throws SQLException {
            when(dataSource.getConnection()).thenReturn(connection);
            when(connection.isValid(5)).thenReturn(true);
            when(healthCheckRepository.save(any(SystemHealthCheck.class))).thenAnswer(inv -> {
                SystemHealthCheck hc = inv.getArgument(0);
                hc.setId(UUID.randomUUID());
                hc.setCreatedAt(Instant.now());
                return hc;
            });

            HealthCheckResponse response = healthCheckService.checkComponent(HealthComponent.DATABASE);

            assertThat(response.component()).isEqualTo(HealthComponent.DATABASE);
            assertThat(response.status()).isEqualTo(HealthStatus.HEALTHY);
            assertThat(response.responseTimeMs()).isNotNull();
            assertThat(response.message()).contains("доступна");
        }

        @Test
        @DisplayName("Should return DOWN when database is not reachable")
        void checkComponent_DatabaseDown() throws SQLException {
            when(dataSource.getConnection()).thenThrow(new SQLException("Connection refused"));
            when(healthCheckRepository.save(any(SystemHealthCheck.class))).thenAnswer(inv -> {
                SystemHealthCheck hc = inv.getArgument(0);
                hc.setId(UUID.randomUUID());
                hc.setCreatedAt(Instant.now());
                return hc;
            });

            HealthCheckResponse response = healthCheckService.checkComponent(HealthComponent.DATABASE);

            assertThat(response.component()).isEqualTo(HealthComponent.DATABASE);
            assertThat(response.status()).isEqualTo(HealthStatus.DOWN);
            assertThat(response.message()).contains("Ошибка");
        }
    }

    @Nested
    @DisplayName("Get Latest Status")
    class GetLatestStatusTests {

        @Test
        @DisplayName("Should return latest status for all components")
        void getLatestStatus_ReturnsAll() {
            SystemHealthCheck dbCheck = SystemHealthCheck.builder()
                    .component(HealthComponent.DATABASE)
                    .status(HealthStatus.HEALTHY)
                    .responseTimeMs(15L)
                    .message("OK")
                    .checkedAt(Instant.now())
                    .build();
            dbCheck.setId(UUID.randomUUID());
            dbCheck.setCreatedAt(Instant.now());

            SystemHealthCheck redisCheck = SystemHealthCheck.builder()
                    .component(HealthComponent.REDIS)
                    .status(HealthStatus.DEGRADED)
                    .responseTimeMs(500L)
                    .message("Высокое время отклика")
                    .checkedAt(Instant.now())
                    .build();
            redisCheck.setId(UUID.randomUUID());
            redisCheck.setCreatedAt(Instant.now());

            when(healthCheckRepository.findLatestForAllComponents())
                    .thenReturn(List.of(dbCheck, redisCheck));

            List<HealthCheckResponse> status = healthCheckService.getLatestStatus();

            assertThat(status).hasSize(2);
            assertThat(status.get(0).component()).isEqualTo(HealthComponent.DATABASE);
            assertThat(status.get(0).status()).isEqualTo(HealthStatus.HEALTHY);
            assertThat(status.get(1).component()).isEqualTo(HealthComponent.REDIS);
            assertThat(status.get(1).status()).isEqualTo(HealthStatus.DEGRADED);
        }
    }
}
