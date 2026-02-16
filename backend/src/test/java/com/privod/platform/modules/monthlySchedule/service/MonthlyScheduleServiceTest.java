package com.privod.platform.modules.monthlySchedule.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.monthlySchedule.domain.MonthlySchedule;
import com.privod.platform.modules.monthlySchedule.domain.MonthlyScheduleLine;
import com.privod.platform.modules.monthlySchedule.domain.MonthlyScheduleStatus;
import com.privod.platform.modules.monthlySchedule.repository.MonthlyScheduleLineRepository;
import com.privod.platform.modules.monthlySchedule.repository.MonthlyScheduleRepository;
import com.privod.platform.modules.monthlySchedule.web.dto.CreateMonthlyScheduleLineRequest;
import com.privod.platform.modules.monthlySchedule.web.dto.CreateMonthlyScheduleRequest;
import com.privod.platform.modules.monthlySchedule.web.dto.MonthlyScheduleLineResponse;
import com.privod.platform.modules.monthlySchedule.web.dto.MonthlyScheduleResponse;
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
class MonthlyScheduleServiceTest {

    @Mock
    private MonthlyScheduleRepository scheduleRepository;

    @Mock
    private MonthlyScheduleLineRepository lineRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private MonthlyScheduleService monthlyScheduleService;

    private UUID scheduleId;
    private UUID projectId;
    private MonthlySchedule testSchedule;

    @BeforeEach
    void setUp() {
        scheduleId = UUID.randomUUID();
        projectId = UUID.randomUUID();

        testSchedule = MonthlySchedule.builder()
                .projectId(projectId)
                .year(2025)
                .month(6)
                .status(MonthlyScheduleStatus.DRAFT)
                .build();
        testSchedule.setId(scheduleId);
        testSchedule.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Monthly Schedule")
    class CreateScheduleTests {

        @Test
        @DisplayName("Should create monthly schedule with DRAFT status")
        void shouldCreateSchedule_whenValidInput() {
            CreateMonthlyScheduleRequest request = new CreateMonthlyScheduleRequest(projectId, 2025, 7);

            when(scheduleRepository.findByProjectIdAndYearAndMonthAndDeletedFalse(projectId, 2025, 7))
                    .thenReturn(Optional.empty());
            when(scheduleRepository.save(any(MonthlySchedule.class))).thenAnswer(inv -> {
                MonthlySchedule s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            MonthlyScheduleResponse response = monthlyScheduleService.create(request);

            assertThat(response.status()).isEqualTo(MonthlyScheduleStatus.DRAFT);
            assertThat(response.year()).isEqualTo(2025);
            assertThat(response.month()).isEqualTo(7);
            verify(auditService).logCreate(eq("MonthlySchedule"), any(UUID.class));
        }

        @Test
        @DisplayName("Should throw when schedule for same month already exists")
        void shouldThrowException_whenDuplicateMonthSchedule() {
            CreateMonthlyScheduleRequest request = new CreateMonthlyScheduleRequest(projectId, 2025, 6);

            when(scheduleRepository.findByProjectIdAndYearAndMonthAndDeletedFalse(projectId, 2025, 6))
                    .thenReturn(Optional.of(testSchedule));

            assertThatThrownBy(() -> monthlyScheduleService.create(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Месячный график на 6/2025 для данного проекта уже существует");
        }
    }

    @Nested
    @DisplayName("Find Monthly Schedule")
    class FindScheduleTests {

        @Test
        @DisplayName("Should find schedule by ID")
        void shouldReturnSchedule_whenExists() {
            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));

            MonthlyScheduleResponse response = monthlyScheduleService.findById(scheduleId);

            assertThat(response).isNotNull();
            assertThat(response.year()).isEqualTo(2025);
            assertThat(response.month()).isEqualTo(6);
        }

        @Test
        @DisplayName("Should throw when schedule not found")
        void shouldThrowException_whenScheduleNotFound() {
            UUID nonExistent = UUID.randomUUID();
            when(scheduleRepository.findById(nonExistent)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> monthlyScheduleService.findById(nonExistent))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Месячный график не найден");
        }
    }

    @Nested
    @DisplayName("Status Transitions")
    class StatusTransitionTests {

        @Test
        @DisplayName("Should submit DRAFT schedule")
        void shouldSubmitSchedule_whenDraft() {
            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));
            when(scheduleRepository.save(any(MonthlySchedule.class))).thenAnswer(inv -> inv.getArgument(0));

            MonthlyScheduleResponse response = monthlyScheduleService.submit(scheduleId);

            assertThat(response.status()).isEqualTo(MonthlyScheduleStatus.SUBMITTED);
            verify(auditService).logStatusChange("MonthlySchedule", scheduleId, "DRAFT", "SUBMITTED");
        }

        @Test
        @DisplayName("Should reject submit when not DRAFT")
        void shouldThrowException_whenSubmitNonDraft() {
            testSchedule.setStatus(MonthlyScheduleStatus.SUBMITTED);
            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));

            assertThatThrownBy(() -> monthlyScheduleService.submit(scheduleId))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Только черновик может быть отправлен");
        }

        @Test
        @DisplayName("Should approve SUBMITTED schedule")
        void shouldApproveSchedule_whenSubmitted() {
            testSchedule.setStatus(MonthlyScheduleStatus.SUBMITTED);
            UUID approvedById = UUID.randomUUID();
            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));
            when(scheduleRepository.save(any(MonthlySchedule.class))).thenAnswer(inv -> inv.getArgument(0));

            MonthlyScheduleResponse response = monthlyScheduleService.approve(scheduleId, approvedById);

            assertThat(response.status()).isEqualTo(MonthlyScheduleStatus.APPROVED);
            assertThat(testSchedule.getApprovedById()).isEqualTo(approvedById);
            assertThat(testSchedule.getApprovedAt()).isNotNull();
        }

        @Test
        @DisplayName("Should reject approve when not SUBMITTED")
        void shouldThrowException_whenApproveNonSubmitted() {
            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));

            assertThatThrownBy(() -> monthlyScheduleService.approve(scheduleId, UUID.randomUUID()))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Только отправленный график может быть утверждён");
        }
    }

    @Nested
    @DisplayName("Line Management")
    class LineManagementTests {

        @Test
        @DisplayName("Should add line to schedule")
        void shouldAddLine_whenScheduleNotClosed() {
            CreateMonthlyScheduleLineRequest request = new CreateMonthlyScheduleLineRequest(
                    scheduleId, "Бетонирование", "м3", new BigDecimal("100"),
                    new BigDecimal("0"), LocalDate.of(2025, 6, 1),
                    LocalDate.of(2025, 6, 15), "Иванов И.И.", null);

            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));
            when(lineRepository.save(any(MonthlyScheduleLine.class))).thenAnswer(inv -> {
                MonthlyScheduleLine line = inv.getArgument(0);
                line.setId(UUID.randomUUID());
                line.setCreatedAt(Instant.now());
                return line;
            });

            MonthlyScheduleLineResponse response = monthlyScheduleService.addLine(request);

            assertThat(response).isNotNull();
            assertThat(response.workName()).isEqualTo("Бетонирование");
            verify(auditService).logCreate(eq("MonthlyScheduleLine"), any(UUID.class));
        }

        @Test
        @DisplayName("Should reject adding line to CLOSED schedule")
        void shouldThrowException_whenAddLineToClosedSchedule() {
            testSchedule.setStatus(MonthlyScheduleStatus.CLOSED);
            CreateMonthlyScheduleLineRequest request = new CreateMonthlyScheduleLineRequest(
                    scheduleId, "Работа", "шт", BigDecimal.ONE,
                    BigDecimal.ZERO, null, null, null, null);

            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));

            assertThatThrownBy(() -> monthlyScheduleService.addLine(request))
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("Нельзя добавить строку в закрытый график");
        }

        @Test
        @DisplayName("Should delete line")
        void shouldDeleteLine_whenExists() {
            UUID lineId = UUID.randomUUID();
            MonthlyScheduleLine line = MonthlyScheduleLine.builder()
                    .scheduleId(scheduleId)
                    .workName("Работа")
                    .build();
            line.setId(lineId);
            line.setCreatedAt(Instant.now());

            when(lineRepository.findById(lineId)).thenReturn(Optional.of(line));
            when(lineRepository.save(any(MonthlyScheduleLine.class))).thenAnswer(inv -> inv.getArgument(0));

            monthlyScheduleService.deleteLine(lineId);

            assertThat(line.isDeleted()).isTrue();
            verify(auditService).logDelete("MonthlyScheduleLine", lineId);
        }
    }

    @Nested
    @DisplayName("Delete Monthly Schedule")
    class DeleteScheduleTests {

        @Test
        @DisplayName("Should soft delete schedule")
        void shouldSoftDelete_whenValidId() {
            when(scheduleRepository.findById(scheduleId)).thenReturn(Optional.of(testSchedule));
            when(scheduleRepository.save(any(MonthlySchedule.class))).thenAnswer(inv -> inv.getArgument(0));

            monthlyScheduleService.delete(scheduleId);

            assertThat(testSchedule.isDeleted()).isTrue();
            verify(auditService).logDelete("MonthlySchedule", scheduleId);
        }
    }
}
