package com.privod.platform.modules.monitoring;

import com.privod.platform.modules.monitoring.domain.EventSeverity;
import com.privod.platform.modules.monitoring.domain.SystemEvent;
import com.privod.platform.modules.monitoring.domain.SystemEventType;
import com.privod.platform.modules.monitoring.repository.SystemEventRepository;
import com.privod.platform.modules.monitoring.service.SystemEventService;
import com.privod.platform.modules.monitoring.web.dto.LogEventRequest;
import com.privod.platform.modules.monitoring.web.dto.SystemEventResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SystemEventServiceTest {

    @Mock
    private SystemEventRepository eventRepository;

    @InjectMocks
    private SystemEventService systemEventService;

    @Nested
    @DisplayName("Log Event")
    class LogEventTests {

        @Test
        @DisplayName("Should log system event with all fields")
        void logEvent_Success() {
            LogEventRequest request = new LogEventRequest(
                    SystemEventType.DEPLOYMENT,
                    EventSeverity.INFO,
                    "Развёрнута версия 2.1.0",
                    Map.of("version", "2.1.0", "environment", "production"),
                    "deploy-service",
                    UUID.randomUUID()
            );

            when(eventRepository.save(any(SystemEvent.class))).thenAnswer(inv -> {
                SystemEvent event = inv.getArgument(0);
                event.setId(UUID.randomUUID());
                event.setCreatedAt(Instant.now());
                return event;
            });

            SystemEventResponse response = systemEventService.logEvent(request);

            assertThat(response.eventType()).isEqualTo(SystemEventType.DEPLOYMENT);
            assertThat(response.severity()).isEqualTo(EventSeverity.INFO);
            assertThat(response.message()).isEqualTo("Развёрнута версия 2.1.0");
            assertThat(response.source()).isEqualTo("deploy-service");
        }
    }

    @Nested
    @DisplayName("Get Recent Errors")
    class RecentErrorsTests {

        @Test
        @DisplayName("Should return recent ERROR and CRITICAL events")
        void getRecentErrors_ReturnsErrors() {
            SystemEvent error1 = SystemEvent.builder()
                    .eventType(SystemEventType.ERROR)
                    .severity(EventSeverity.ERROR)
                    .message("Ошибка подключения к 1С")
                    .source("integration-1c")
                    .occurredAt(Instant.now())
                    .build();
            error1.setId(UUID.randomUUID());
            error1.setCreatedAt(Instant.now());

            SystemEvent error2 = SystemEvent.builder()
                    .eventType(SystemEventType.BACKUP_FAILED)
                    .severity(EventSeverity.CRITICAL)
                    .message("Резервное копирование не удалось")
                    .source("backup-service")
                    .occurredAt(Instant.now().minusSeconds(3600))
                    .build();
            error2.setId(UUID.randomUUID());
            error2.setCreatedAt(Instant.now());

            when(eventRepository.findRecentErrors(any(PageRequest.class)))
                    .thenReturn(List.of(error1, error2));

            List<SystemEventResponse> errors = systemEventService.getRecentErrors();

            assertThat(errors).hasSize(2);
            assertThat(errors.get(0).severity()).isEqualTo(EventSeverity.ERROR);
            assertThat(errors.get(1).severity()).isEqualTo(EventSeverity.CRITICAL);
            assertThat(errors.get(0).message()).contains("1С");
        }
    }
}
