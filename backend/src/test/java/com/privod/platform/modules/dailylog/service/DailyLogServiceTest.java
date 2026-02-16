package com.privod.platform.modules.dailylog.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.dailylog.domain.DailyLog;
import com.privod.platform.modules.dailylog.domain.DailyLogPhoto;
import com.privod.platform.modules.dailylog.domain.DailyLogStatus;
import com.privod.platform.modules.dailylog.repository.DailyLogPhotoRepository;
import com.privod.platform.modules.dailylog.repository.DailyLogRepository;
import com.privod.platform.modules.dailylog.web.dto.CreateDailyLogPhotoRequest;
import com.privod.platform.modules.dailylog.web.dto.CreateDailyLogRequest;
import com.privod.platform.modules.dailylog.web.dto.DailyLogPhotoResponse;
import com.privod.platform.modules.dailylog.web.dto.DailyLogResponse;
import com.privod.platform.modules.dailylog.web.dto.UpdateDailyLogRequest;
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
                .weatherConditions("Солнечно")
                .temperatureMin(new BigDecimal("18"))
                .temperatureMax(new BigDecimal("28"))
                .shiftSupervisorName("Иванов И.И.")
                .status(DailyLogStatus.DRAFT)
                .build();
        testLog.setId(logId);
        testLog.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Daily Log")
    class CreateDailyLogTests {

        @Test
        @DisplayName("Should create daily log with DRAFT status")
        void shouldCreateLog_whenValidInput() {
            CreateDailyLogRequest request = new CreateDailyLogRequest(
                    projectId, LocalDate.of(2025, 7, 1), "Облачно",
                    new BigDecimal("15"), new BigDecimal("22"), null,
                    UUID.randomUUID(), "Петров П.П.", null);

            when(dailyLogRepository.findByProjectIdAndLogDateAndDeletedFalse(projectId, LocalDate.of(2025, 7, 1)))
                    .thenReturn(Optional.empty());
            when(dailyLogRepository.getNextNumberSequence()).thenReturn(1L);
            when(dailyLogRepository.save(any(DailyLog.class))).thenAnswer(inv -> {
                DailyLog log = inv.getArgument(0);
                log.setId(UUID.randomUUID());
                log.setCreatedAt(Instant.now());
                return log;
            });

            DailyLogResponse response = dailyLogService.createLog(request);

            assertThat(response.status()).isEqualTo(DailyLogStatus.DRAFT);
            assertThat(response.code()).isEqualTo("KS6-00001");
            verify(auditService).logCreate(eq("DailyLog"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when log for same date already exists")
        void shouldThrowException_whenDuplicateDate() {
            CreateDailyLogRequest request = new CreateDailyLogRequest(
                    projectId, LocalDate.of(2025, 6, 15), "Дождь",
                    null, null, null, null, null, null);

            when(dailyLogRepository.findByProjectIdAndLogDateAndDeletedFalse(projectId, LocalDate.of(2025, 6, 15)))
                    .thenReturn(Optional.of(testLog));

            assertThatThrownBy(() -> dailyLogService.createLog(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Журнал КС-6 уже существует для проекта на дату");
        }
    }

    @Nested
    @DisplayName("Get Daily Log")
    class GetDailyLogTests {

        @Test
        @DisplayName("Should find daily log by ID")
        void shouldReturnLog_whenExists() {
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));

            DailyLogResponse response = dailyLogService.getLog(logId);

            assertThat(response).isNotNull();
            assertThat(response.code()).isEqualTo("KS6-00001");
            assertThat(response.weatherConditions()).isEqualTo("Солнечно");
        }

        @Test
        @DisplayName("Should throw when daily log not found")
        void shouldThrowException_whenLogNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(dailyLogRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> dailyLogService.getLog(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Журнал КС-6 не найден");
        }

        @Test
        @DisplayName("Should find daily log by project and date")
        void shouldReturnLog_whenFoundByProjectAndDate() {
            when(dailyLogRepository.findByProjectIdAndLogDateAndDeletedFalse(projectId, LocalDate.of(2025, 6, 15)))
                    .thenReturn(Optional.of(testLog));

            DailyLogResponse response = dailyLogService.getLogByProjectAndDate(projectId, LocalDate.of(2025, 6, 15));

            assertThat(response).isNotNull();
            assertThat(response.logDate()).isEqualTo(LocalDate.of(2025, 6, 15));
        }
    }

    @Nested
    @DisplayName("Update Daily Log")
    class UpdateDailyLogTests {

        @Test
        @DisplayName("Should update daily log when DRAFT")
        void shouldUpdateLog_whenDraft() {
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));
            when(dailyLogRepository.save(any(DailyLog.class))).thenAnswer(inv -> inv.getArgument(0));

            UpdateDailyLogRequest request = new UpdateDailyLogRequest(
                    "Переменная облачность", new BigDecimal("20"), new BigDecimal("30"),
                    null, null, null, "Обновлённые заметки");

            DailyLogResponse response = dailyLogService.updateLog(logId, request);

            assertThat(testLog.getWeatherConditions()).isEqualTo("Переменная облачность");
            verify(auditService).logUpdate("DailyLog", logId, "multiple", null, null);
        }

        @Test
        @DisplayName("Should reject update when APPROVED")
        void shouldThrowException_whenUpdateApprovedLog() {
            testLog.setStatus(DailyLogStatus.APPROVED);
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));

            UpdateDailyLogRequest request = new UpdateDailyLogRequest(
                    "Попытка", null, null, null, null, null, null);

            assertThatThrownBy(() -> dailyLogService.updateLog(logId, request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно редактировать утвержденный журнал");
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should submit DRAFT log")
        void shouldSubmitLog_whenDraft() {
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));
            when(dailyLogRepository.save(any(DailyLog.class))).thenAnswer(inv -> inv.getArgument(0));

            DailyLogResponse response = dailyLogService.submitLog(logId);

            assertThat(response.status()).isEqualTo(DailyLogStatus.SUBMITTED);
            verify(auditService).logStatusChange("DailyLog", logId, "DRAFT", "SUBMITTED");
        }

        @Test
        @DisplayName("Should reject submit when not DRAFT")
        void shouldThrowException_whenSubmitNonDraft() {
            testLog.setStatus(DailyLogStatus.SUBMITTED);
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));

            assertThatThrownBy(() -> dailyLogService.submitLog(logId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно отправить журнал из статуса");
        }

        @Test
        @DisplayName("Should approve SUBMITTED log")
        void shouldApproveLog_whenSubmitted() {
            testLog.setStatus(DailyLogStatus.SUBMITTED);
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));
            when(dailyLogRepository.save(any(DailyLog.class))).thenAnswer(inv -> inv.getArgument(0));

            DailyLogResponse response = dailyLogService.approveLog(logId);

            assertThat(response.status()).isEqualTo(DailyLogStatus.APPROVED);
            verify(auditService).logStatusChange("DailyLog", logId, "SUBMITTED", "APPROVED");
        }

        @Test
        @DisplayName("Should reject approve when not SUBMITTED")
        void shouldThrowException_whenApproveNonSubmitted() {
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));

            assertThatThrownBy(() -> dailyLogService.approveLog(logId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно утвердить журнал из статуса");
        }
    }

    @Nested
    @DisplayName("Delete Daily Log")
    class DeleteDailyLogTests {

        @Test
        @DisplayName("Should soft delete DRAFT log")
        void shouldSoftDelete_whenDraft() {
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));
            when(dailyLogRepository.save(any(DailyLog.class))).thenAnswer(inv -> inv.getArgument(0));

            dailyLogService.deleteLog(logId);

            assertThat(testLog.isDeleted()).isTrue();
            verify(auditService).logDelete("DailyLog", logId);
        }

        @Test
        @DisplayName("Should reject delete when APPROVED")
        void shouldThrowException_whenDeleteApprovedLog() {
            testLog.setStatus(DailyLogStatus.APPROVED);
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));

            assertThatThrownBy(() -> dailyLogService.deleteLog(logId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно удалить утвержденный журнал");
        }
    }

    @Nested
    @DisplayName("Photo Management")
    class PhotoTests {

        @Test
        @DisplayName("Should add photo to daily log")
        void shouldAddPhoto_whenLogExists() {
            CreateDailyLogPhotoRequest request = new CreateDailyLogPhotoRequest(
                    "https://storage/photo1.jpg", "https://storage/thumb1.jpg",
                    "Вид площадки", Instant.now(), UUID.randomUUID(),
                    new BigDecimal("55.7558"), new BigDecimal("37.6173"));

            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));
            when(photoRepository.save(any(DailyLogPhoto.class))).thenAnswer(inv -> {
                DailyLogPhoto p = inv.getArgument(0);
                p.setId(UUID.randomUUID());
                p.setCreatedAt(Instant.now());
                return p;
            });

            DailyLogPhotoResponse response = dailyLogService.addPhoto(logId, request);

            assertThat(response).isNotNull();
            assertThat(response.caption()).isEqualTo("Вид площадки");
        }

        @Test
        @DisplayName("Should delete photo from daily log")
        void shouldDeletePhoto_whenExists() {
            UUID photoId = UUID.randomUUID();
            DailyLogPhoto photo = DailyLogPhoto.builder()
                    .dailyLogId(logId)
                    .photoUrl("https://storage/photo.jpg")
                    .build();
            photo.setId(photoId);
            photo.setCreatedAt(Instant.now());

            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));
            when(photoRepository.findById(photoId)).thenReturn(Optional.of(photo));
            when(photoRepository.save(any(DailyLogPhoto.class))).thenAnswer(inv -> inv.getArgument(0));

            dailyLogService.deletePhoto(logId, photoId);

            assertThat(photo.isDeleted()).isTrue();
        }

        @Test
        @DisplayName("Should throw when deleting non-existent photo")
        void shouldThrowException_whenPhotoNotFound() {
            UUID photoId = UUID.randomUUID();
            when(dailyLogRepository.findById(logId)).thenReturn(Optional.of(testLog));
            when(photoRepository.findById(photoId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> dailyLogService.deletePhoto(logId, photoId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Фотография не найдена");
        }
    }
}
