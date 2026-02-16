package com.privod.platform.modules.regulatory;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.regulatory.domain.DeadlineStatus;
import com.privod.platform.modules.regulatory.domain.ReportingDeadline;
import com.privod.platform.modules.regulatory.domain.ReportingFrequency;
import com.privod.platform.modules.regulatory.domain.ReportingSubmission;
import com.privod.platform.modules.regulatory.domain.SubmissionChannel;
import com.privod.platform.modules.regulatory.repository.ReportingDeadlineRepository;
import com.privod.platform.modules.regulatory.repository.ReportingSubmissionRepository;
import com.privod.platform.modules.regulatory.service.ReportingCalendarService;
import com.privod.platform.modules.regulatory.web.dto.CreateReportingDeadlineRequest;
import com.privod.platform.modules.regulatory.web.dto.CreateReportingSubmissionRequest;
import com.privod.platform.modules.regulatory.web.dto.ReportingDeadlineResponse;
import com.privod.platform.modules.regulatory.web.dto.ReportingSubmissionResponse;
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
class ReportingCalendarServiceTest {

    @Mock
    private ReportingDeadlineRepository deadlineRepository;

    @Mock
    private ReportingSubmissionRepository submissionRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private ReportingCalendarService reportingCalendarService;

    private UUID deadlineId;
    private ReportingDeadline testDeadline;

    @BeforeEach
    void setUp() {
        deadlineId = UUID.randomUUID();

        testDeadline = ReportingDeadline.builder()
                .name("Квартальный отчёт в Ростехнадзор")
                .reportType("QUARTERLY_SAFETY")
                .frequency(ReportingFrequency.QUARTERLY)
                .dueDate(LocalDate.of(2025, 7, 15))
                .reminderDaysBefore(10)
                .responsibleId(UUID.randomUUID())
                .status(DeadlineStatus.UPCOMING)
                .notes("Включить данные по всем объектам")
                .regulatoryBody("Ростехнадзор")
                .penaltyAmount(new BigDecimal("500000.00"))
                .build();
        testDeadline.setId(deadlineId);
        testDeadline.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Deadline")
    class CreateDeadlineTests {

        @Test
        @DisplayName("Should create deadline with UPCOMING status and default frequency")
        void createDeadline_SetsDefaults() {
            CreateReportingDeadlineRequest request = new CreateReportingDeadlineRequest(
                    "Ежемесячный отчёт", "MONTHLY_PROGRESS",
                    null, LocalDate.of(2025, 8, 1),
                    null, UUID.randomUUID(),
                    "Отправить до обеда", "Минстрой",
                    new BigDecimal("100000.00")
            );

            when(deadlineRepository.save(any(ReportingDeadline.class))).thenAnswer(inv -> {
                ReportingDeadline d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            ReportingDeadlineResponse response = reportingCalendarService.createDeadline(request);

            assertThat(response.status()).isEqualTo(DeadlineStatus.UPCOMING);
            assertThat(response.frequency()).isEqualTo(ReportingFrequency.MONTHLY);
            assertThat(response.reminderDaysBefore()).isEqualTo(5);
            assertThat(response.name()).isEqualTo("Ежемесячный отчёт");
            assertThat(response.regulatoryBody()).isEqualTo("Минстрой");
            verify(auditService).logCreate(eq("ReportingDeadline"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create deadline with explicit frequency")
        void createDeadline_ExplicitFrequency() {
            CreateReportingDeadlineRequest request = new CreateReportingDeadlineRequest(
                    "Годовой отчёт", "ANNUAL_TAX", ReportingFrequency.ANNUAL,
                    LocalDate.of(2026, 3, 31), 30, UUID.randomUUID(),
                    null, "ФНС", new BigDecimal("1000000.00")
            );

            when(deadlineRepository.save(any(ReportingDeadline.class))).thenAnswer(inv -> {
                ReportingDeadline d = inv.getArgument(0);
                d.setId(UUID.randomUUID());
                d.setCreatedAt(Instant.now());
                return d;
            });

            ReportingDeadlineResponse response = reportingCalendarService.createDeadline(request);

            assertThat(response.frequency()).isEqualTo(ReportingFrequency.ANNUAL);
            assertThat(response.reminderDaysBefore()).isEqualTo(30);
        }
    }

    @Nested
    @DisplayName("Mark As Submitted")
    class MarkAsSubmittedTests {

        @Test
        @DisplayName("Should mark deadline as SUBMITTED with timestamp and submitter")
        void markAsSubmitted_Success() {
            UUID submitterId = UUID.randomUUID();
            when(deadlineRepository.findById(deadlineId)).thenReturn(Optional.of(testDeadline));
            when(deadlineRepository.save(any(ReportingDeadline.class))).thenAnswer(inv -> inv.getArgument(0));

            ReportingDeadlineResponse response = reportingCalendarService.markAsSubmitted(deadlineId, submitterId);

            assertThat(response.status()).isEqualTo(DeadlineStatus.SUBMITTED);
            assertThat(response.submittedAt()).isNotNull();
            assertThat(response.submittedById()).isEqualTo(submitterId);
            verify(auditService).logStatusChange("ReportingDeadline", deadlineId,
                    "UPCOMING", "SUBMITTED");
        }

        @Test
        @DisplayName("Should throw when deadline not found")
        void markAsSubmitted_NotFound_Throws() {
            UUID nonExistentId = UUID.randomUUID();
            when(deadlineRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reportingCalendarService.markAsSubmitted(nonExistentId, UUID.randomUUID()))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Дедлайн отчётности не найден");
        }
    }

    @Nested
    @DisplayName("Find Upcoming Deadlines")
    class FindUpcomingTests {

        @Test
        @DisplayName("Should return upcoming deadlines within given days")
        void findUpcoming_ReturnsList() {
            when(deadlineRepository.findUpcomingDeadlines(any(LocalDate.class)))
                    .thenReturn(List.of(testDeadline));

            List<ReportingDeadlineResponse> result = reportingCalendarService.findUpcomingDeadlines(30);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("Квартальный отчёт в Ростехнадзор");
            assertThat(result.get(0).regulatoryBody()).isEqualTo("Ростехнадзор");
        }

        @Test
        @DisplayName("Should return empty list when no upcoming deadlines")
        void findUpcoming_EmptyList() {
            when(deadlineRepository.findUpcomingDeadlines(any(LocalDate.class)))
                    .thenReturn(List.of());

            List<ReportingDeadlineResponse> result = reportingCalendarService.findUpcomingDeadlines(7);

            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Find Overdue Deadlines")
    class FindOverdueTests {

        @Test
        @DisplayName("Should return overdue deadlines")
        void findOverdue_ReturnsList() {
            ReportingDeadline overdue = ReportingDeadline.builder()
                    .name("Просроченный отчёт")
                    .reportType("MISSED_REPORT")
                    .dueDate(LocalDate.of(2025, 1, 15))
                    .status(DeadlineStatus.OVERDUE)
                    .regulatoryBody("ФНС")
                    .build();
            overdue.setId(UUID.randomUUID());
            overdue.setCreatedAt(Instant.now());

            when(deadlineRepository.findOverdueDeadlines(any(LocalDate.class)))
                    .thenReturn(List.of(overdue));

            List<ReportingDeadlineResponse> result = reportingCalendarService.findOverdueDeadlines();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).status()).isEqualTo(DeadlineStatus.OVERDUE);
            assertThat(result.get(0).name()).isEqualTo("Просроченный отчёт");
        }
    }

    @Nested
    @DisplayName("Create Submission")
    class CreateSubmissionTests {

        @Test
        @DisplayName("Should create submission with default ELECTRONIC channel")
        void createSubmission_DefaultChannel() {
            CreateReportingSubmissionRequest request = new CreateReportingSubmissionRequest(
                    deadlineId, LocalDate.of(2025, 7, 10), UUID.randomUUID(),
                    "CONF-12345", null, "/files/report.pdf"
            );

            when(deadlineRepository.findById(deadlineId)).thenReturn(Optional.of(testDeadline));
            when(submissionRepository.save(any(ReportingSubmission.class))).thenAnswer(inv -> {
                ReportingSubmission s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            ReportingSubmissionResponse response = reportingCalendarService.createSubmission(request);

            assertThat(response.channel()).isEqualTo(SubmissionChannel.ELECTRONIC);
            assertThat(response.confirmationNumber()).isEqualTo("CONF-12345");
            assertThat(response.deadlineId()).isEqualTo(deadlineId);
            verify(auditService).logCreate(eq("ReportingSubmission"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create submission with explicit EDO channel")
        void createSubmission_ExplicitEdoChannel() {
            CreateReportingSubmissionRequest request = new CreateReportingSubmissionRequest(
                    deadlineId, LocalDate.of(2025, 7, 10), UUID.randomUUID(),
                    "EDO-999", SubmissionChannel.EDO, "/files/report-edo.pdf"
            );

            when(deadlineRepository.findById(deadlineId)).thenReturn(Optional.of(testDeadline));
            when(submissionRepository.save(any(ReportingSubmission.class))).thenAnswer(inv -> {
                ReportingSubmission s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            ReportingSubmissionResponse response = reportingCalendarService.createSubmission(request);

            assertThat(response.channel()).isEqualTo(SubmissionChannel.EDO);
        }

        @Test
        @DisplayName("Should throw when deadline not found for submission")
        void createSubmission_DeadlineNotFound_Throws() {
            UUID nonExistentId = UUID.randomUUID();
            CreateReportingSubmissionRequest request = new CreateReportingSubmissionRequest(
                    nonExistentId, LocalDate.now(), UUID.randomUUID(),
                    null, null, null
            );

            when(deadlineRepository.findById(nonExistentId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> reportingCalendarService.createSubmission(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Дедлайн отчётности не найден");
        }
    }
}
