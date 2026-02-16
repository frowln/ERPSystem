package com.privod.platform.modules.calendar;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.calendar.domain.ConstructionSchedule;
import com.privod.platform.modules.calendar.domain.ScheduleStatus;
import com.privod.platform.modules.calendar.repository.ConstructionScheduleRepository;
import com.privod.platform.modules.calendar.service.ConstructionScheduleService;
import com.privod.platform.modules.calendar.web.dto.ConstructionScheduleResponse;
import com.privod.platform.modules.calendar.web.dto.CreateScheduleRequest;
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
class ConstructionScheduleServiceTest {

    @Mock
    private ConstructionScheduleRepository scheduleRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ConstructionScheduleService scheduleService;

    private UUID scheduleId;
    private UUID projectId;
    private ConstructionSchedule testSchedule;

    @BeforeEach
    void setUp() {
        scheduleId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testSchedule = ConstructionSchedule.builder()
                .projectId(projectId)
                .name("Календарный план строительства корпуса А")
                .description("Основной план строительных работ")
                .status(ScheduleStatus.DRAFT)
                .plannedStartDate(LocalDate.of(2025, 3, 1))
                .plannedEndDate(LocalDate.of(2025, 12, 31))
                .docVersion(1)
                .build();
        testSchedule.setId(scheduleId);
        testSchedule.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Schedule")
    class CreateScheduleTests {

        @Test
        @DisplayName("Should create schedule with DRAFT status")
        void createSchedule_SetsDefaultDraftStatus() {
            CreateScheduleRequest request = new CreateScheduleRequest(
                    projectId,
                    "Новый календарный план",
                    "Описание плана",
                    LocalDate.of(2025, 4, 1),
                    LocalDate.of(2026, 3, 31));

            when(scheduleRepository.save(any(ConstructionSchedule.class))).thenAnswer(inv -> {
                ConstructionSchedule s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            ConstructionScheduleResponse response = scheduleService.createSchedule(request);

            assertThat(response.status()).isEqualTo(ScheduleStatus.DRAFT);
            assertThat(response.docVersion()).isEqualTo(1);
            assertThat(response.name()).isEqualTo("Новый календарный план");
            verify(auditService).logCreate(eq("ConstructionSchedule"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Workflow")
    class WorkflowTests {

        @Test
        @DisplayName("Should approve DRAFT schedule")
        void approve_ValidTransition() {
            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));
            when(scheduleRepository.save(any(ConstructionSchedule.class))).thenAnswer(inv -> inv.getArgument(0));

            ConstructionScheduleResponse response = scheduleService.approve(scheduleId);

            assertThat(response.status()).isEqualTo(ScheduleStatus.APPROVED);
            verify(auditService).logStatusChange("ConstructionSchedule", scheduleId,
                    "DRAFT", "APPROVED");
        }

        @Test
        @DisplayName("Should reject approve on non-DRAFT schedule")
        void approve_InvalidTransition() {
            testSchedule.setStatus(ScheduleStatus.ACTIVE);
            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));

            assertThatThrownBy(() -> scheduleService.approve(scheduleId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно утвердить");
        }

        @Test
        @DisplayName("Should activate APPROVED schedule")
        void activate_ValidTransition() {
            testSchedule.setStatus(ScheduleStatus.APPROVED);
            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));
            when(scheduleRepository.save(any(ConstructionSchedule.class))).thenAnswer(inv -> inv.getArgument(0));

            ConstructionScheduleResponse response = scheduleService.activate(scheduleId);

            assertThat(response.status()).isEqualTo(ScheduleStatus.ACTIVE);
            verify(auditService).logStatusChange("ConstructionSchedule", scheduleId,
                    "APPROVED", "ACTIVE");
        }

        @Test
        @DisplayName("Should reject activate on DRAFT schedule")
        void activate_InvalidTransition() {
            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));

            assertThatThrownBy(() -> scheduleService.activate(scheduleId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Невозможно активировать");
        }
    }

    @Nested
    @DisplayName("Get Active Schedule")
    class GetActiveScheduleTests {

        @Test
        @DisplayName("Should throw when no active schedule found")
        void getActiveSchedule_NotFound() {
            when(scheduleRepository.findByProjectIdAndStatusAndDeletedFalse(
                    projectId, ScheduleStatus.ACTIVE))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> scheduleService.getActiveSchedule(projectId))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Активный календарный план не найден");
        }
    }
}
