package com.privod.platform.modules.dailylog;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.dailylog.domain.DailyLog;
import com.privod.platform.modules.dailylog.domain.DailyLogStatus;
import com.privod.platform.modules.dailylog.domain.WeatherCondition;
import com.privod.platform.modules.dailylog.repository.DailyLogPhotoRepository;
import com.privod.platform.modules.dailylog.repository.DailyLogRepository;
import com.privod.platform.modules.dailylog.service.DailyLogService;
import com.privod.platform.modules.dailylog.web.dto.CreateDailyLogRequest;
import com.privod.platform.modules.dailylog.web.dto.DailyLogResponse;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DailyLogServiceTest {

    @Mock
    private DailyLogRepository dailyLogRepository;

    @Mock
    private DailyLogPhotoRepository photoRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private DailyLogService dailyLogService;

    private UUID logId;
    private UUID projectId;
    private DailyLog testLog;

    @BeforeEach
    void setUp() {
        logId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testLog = DailyLog.builder()
                .code("KS6-00001")
                .projectId(projectId)
                .logDate(LocalDate.of(2025, 6, 15))
                .weatherConditions(WeatherCondition.CLEAR)
                .temperatureMin(new BigDecimal("18.5"))
                .temperatureMax(new BigDecimal("27.3"))
                .windSpeed(new BigDecimal("3.5"))
                .shiftSupervisorId(UUID.randomUUID())
                .shiftSupervisorName("Петров М.И.")
                .status(DailyLogStatus.DRAFT)
                .generalNotes("Работы выполняются по графику")
                .build();
        testLog.setId(logId);
        testLog.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Daily Log")
    class CreateTests {

        @Test
        @DisplayName("Should create daily log with DRAFT status")
        void createLog_SetsDefaults() {
            CreateDailyLogRequest request = new CreateDailyLogRequest(
                    projectId,
                    LocalDate.of(2025, 6, 16),
                    WeatherCondition.CLOUDY,
                    new BigDecimal("15.0"),
                    new BigDecimal("22.0"),
                    new BigDecimal("5.0"),
                    UUID.randomUUID(), "Сидоров А.Б.",
                    "Начало бетонных работ"
            );

            when(dailyLogRepository.findByProjectIdAndLogDateAndDeletedFalse(
                    request.projectId(), request.logDate())).thenReturn(Optional.empty());
            when(dailyLogRepository.getNextNumberSequence()).thenReturn(1L);
            when(dailyLogRepository.save(any(DailyLog.class))).thenAnswer(inv -> {
                DailyLog dl = inv.getArgument(0);
                dl.setId(UUID.randomUUID());
                dl.setCreatedAt(Instant.now());
                return dl;
            });

            DailyLogResponse response = dailyLogService.createLog(request);

            assertThat(response.status()).isEqualTo(DailyLogStatus.DRAFT);
            assertThat(response.code()).isEqualTo("KS6-00001");
            assertThat(response.weatherConditions()).isEqualTo(WeatherCondition.CLOUDY);
            verify(auditService).logCreate(eq("DailyLog"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject duplicate log for same project and date")
        void createLog_DuplicateDate() {
            CreateDailyLogRequest request = new CreateDailyLogRequest(
                    projectId, testLog.getLogDate(),
                    WeatherCondition.RAIN, null, null, null,
                    null, null, null
            );

            when(dailyLogRepository.findByProjectIdAndLogDateAndDeletedFalse(
                    projectId, testLog.getLogDate())).thenReturn(Optional.of(testLog));

            assertThatThrownBy(() -> dailyLogService.createLog(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Журнал КС-6 уже существует");
        }
    }

    @Nested
    @DisplayName("Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should submit draft log")
        void submitLog_Success() {
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));
            when(dailyLogRepository.save(any(DailyLog.class))).thenAnswer(inv -> inv.getArgument(0));

            DailyLogResponse response = dailyLogService.submitLog(logId);

            assertThat(response.status()).isEqualTo(DailyLogStatus.SUBMITTED);
            verify(auditService).logStatusChange("DailyLog", logId, "DRAFT", "SUBMITTED");
        }

        @Test
        @DisplayName("Should approve submitted log")
        void approveLog_Success() {
            testLog.setStatus(DailyLogStatus.SUBMITTED);
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));
            when(dailyLogRepository.save(any(DailyLog.class))).thenAnswer(inv -> inv.getArgument(0));

            DailyLogResponse response = dailyLogService.approveLog(logId);

            assertThat(response.status()).isEqualTo(DailyLogStatus.APPROVED);
            verify(auditService).logStatusChange("DailyLog", logId, "SUBMITTED", "APPROVED");
        }

        @Test
        @DisplayName("Should reject approving draft log")
        void approveLog_InvalidTransition() {
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));

            assertThatThrownBy(() -> dailyLogService.approveLog(logId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно утвердить журнал");
        }

        @Test
        @DisplayName("Should reject deleting approved log")
        void deleteLog_ApprovedReject() {
            testLog.setStatus(DailyLogStatus.APPROVED);
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));

            assertThatThrownBy(() -> dailyLogService.deleteLog(logId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно удалить утвержденный журнал");
        }
    }

    @Nested
    @DisplayName("Get Daily Log")
    class GetTests {

        @Test
        @DisplayName("Should find log by ID")
        void getLog_Success() {
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));

            DailyLogResponse response = dailyLogService.getLog(logId);

            assertThat(response).isNotNull();
            assertThat(response.code()).isEqualTo("KS6-00001");
            assertThat(response.weatherConditions()).isEqualTo(WeatherCondition.CLEAR);
        }

        @Test
        @DisplayName("Should throw when log not found")
        void getLog_NotFound() {
            UUID nonExistentId = UUID.randomUUID();
            when(dailyLogRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> dailyLogService.getLog(nonExistentId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Журнал КС-6 не найден");
        }
    }
}
