package com.privod.platform.modules.scheduler;

import com.privod.platform.modules.scheduler.domain.JobExecution;
import com.privod.platform.modules.scheduler.domain.JobStatus;
import com.privod.platform.modules.scheduler.domain.ScheduledJob;
import com.privod.platform.modules.scheduler.repository.JobExecutionRepository;
import com.privod.platform.modules.scheduler.repository.ScheduledJobRepository;
import com.privod.platform.modules.scheduler.service.SchedulerService;
import com.privod.platform.modules.scheduler.web.dto.CreateScheduledJobRequest;
import com.privod.platform.modules.scheduler.web.dto.JobExecutionResponse;
import com.privod.platform.modules.scheduler.web.dto.ScheduledJobResponse;
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
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SchedulerServiceTest {

    @Mock
    private ScheduledJobRepository jobRepository;

    @Mock
    private JobExecutionRepository executionRepository;

    @InjectMocks
    private SchedulerService schedulerService;

    private ScheduledJob testJob;

    @BeforeEach
    void setUp() {
        testJob = ScheduledJob.builder()
                .code("CLEANUP_EXPIRED_NOTIFICATIONS")
                .name("Очистка устаревших уведомлений")
                .description("Удаляет прочитанные уведомления старше 90 дней")
                .cronExpression("0 0 2 * * ?")
                .jobClass("com.privod.platform.modules.notification.service.NotificationService")
                .jobMethod("deleteOld")
                .parameters(Map.of("daysOld", 90))
                .isActive(true)
                .maxRetries(3)
                .build();
        testJob.setId(UUID.randomUUID());
        testJob.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Register Job")
    class RegisterTests {

        @Test
        @DisplayName("Should register a new scheduled job")
        void register_Success() {
            CreateScheduledJobRequest request = new CreateScheduledJobRequest(
                    "CLEANUP_EXPIRED_NOTIFICATIONS",
                    "Очистка устаревших уведомлений",
                    "Удаляет прочитанные уведомления старше 90 дней",
                    "0 0 2 * * ?",
                    "com.privod.platform.modules.notification.service.NotificationService",
                    "deleteOld",
                    Map.of("daysOld", 90),
                    3
            );

            when(jobRepository.existsByCodeAndDeletedFalse(request.code())).thenReturn(false);
            when(jobRepository.save(any(ScheduledJob.class))).thenAnswer(inv -> {
                ScheduledJob j = inv.getArgument(0);
                j.setId(UUID.randomUUID());
                j.setCreatedAt(Instant.now());
                return j;
            });

            ScheduledJobResponse response = schedulerService.register(request);

            assertThat(response.code()).isEqualTo("CLEANUP_EXPIRED_NOTIFICATIONS");
            assertThat(response.cronExpression()).isEqualTo("0 0 2 * * ?");
            assertThat(response.isActive()).isTrue();
            assertThat(response.maxRetries()).isEqualTo(3);
        }

        @Test
        @DisplayName("Should throw when job code already exists")
        void register_DuplicateCode() {
            CreateScheduledJobRequest request = new CreateScheduledJobRequest(
                    "CLEANUP_EXPIRED_NOTIFICATIONS",
                    "Очистка", null, "0 0 2 * * ?",
                    "SomeClass", "someMethod", null, null
            );

            when(jobRepository.existsByCodeAndDeletedFalse(request.code())).thenReturn(true);

            assertThatThrownBy(() -> schedulerService.register(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("уже существует");
        }
    }

    @Nested
    @DisplayName("Enable/Disable")
    class ToggleTests {

        @Test
        @DisplayName("Should disable a job")
        void disable_Success() {
            when(jobRepository.findByCodeAndDeletedFalse("CLEANUP_EXPIRED_NOTIFICATIONS"))
                    .thenReturn(Optional.of(testJob));
            when(jobRepository.save(any(ScheduledJob.class))).thenAnswer(inv -> inv.getArgument(0));

            ScheduledJobResponse response = schedulerService.disable("CLEANUP_EXPIRED_NOTIFICATIONS");

            assertThat(response.isActive()).isFalse();
        }

        @Test
        @DisplayName("Should enable a job")
        void enable_Success() {
            testJob.setActive(false);
            when(jobRepository.findByCodeAndDeletedFalse("CLEANUP_EXPIRED_NOTIFICATIONS"))
                    .thenReturn(Optional.of(testJob));
            when(jobRepository.save(any(ScheduledJob.class))).thenAnswer(inv -> inv.getArgument(0));

            ScheduledJobResponse response = schedulerService.enable("CLEANUP_EXPIRED_NOTIFICATIONS");

            assertThat(response.isActive()).isTrue();
        }
    }

    @Nested
    @DisplayName("Manual Run")
    class ManualRunTests {

        @Test
        @DisplayName("Should trigger manual execution")
        void triggerManualRun_Success() {
            when(jobRepository.findByCodeAndDeletedFalse("CLEANUP_EXPIRED_NOTIFICATIONS"))
                    .thenReturn(Optional.of(testJob));
            when(executionRepository.save(any(JobExecution.class))).thenAnswer(inv -> {
                JobExecution e = inv.getArgument(0);
                e.setId(UUID.randomUUID());
                e.setCreatedAt(Instant.now());
                return e;
            });
            when(jobRepository.save(any(ScheduledJob.class))).thenAnswer(inv -> inv.getArgument(0));

            JobExecutionResponse response = schedulerService.triggerManualRun("CLEANUP_EXPIRED_NOTIFICATIONS");

            assertThat(response.status()).isEqualTo(JobStatus.SUCCESS);
            assertThat(response.statusDisplayName()).isEqualTo("Успешно");
            assertThat(response.completedAt()).isNotNull();
            verify(executionRepository).save(any(JobExecution.class));
        }

        @Test
        @DisplayName("Should throw when job not found for manual run")
        void triggerManualRun_NotFound() {
            when(jobRepository.findByCodeAndDeletedFalse("NONEXISTENT"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> schedulerService.triggerManualRun("NONEXISTENT"))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Задание не найдено");
        }
    }
}
