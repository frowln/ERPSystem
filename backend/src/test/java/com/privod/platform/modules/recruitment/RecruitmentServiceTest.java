package com.privod.platform.modules.recruitment;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.recruitment.domain.Applicant;
import com.privod.platform.modules.recruitment.domain.ApplicantPriority;
import com.privod.platform.modules.recruitment.domain.ApplicantStatus;
import com.privod.platform.modules.recruitment.domain.Interview;
import com.privod.platform.modules.recruitment.domain.JobPosition;
import com.privod.platform.modules.recruitment.domain.JobPositionStatus;
import com.privod.platform.modules.recruitment.repository.ApplicantRepository;
import com.privod.platform.modules.recruitment.repository.InterviewRepository;
import com.privod.platform.modules.recruitment.repository.JobPositionRepository;
import com.privod.platform.modules.recruitment.repository.RecruitmentStageRepository;
import com.privod.platform.modules.recruitment.service.RecruitmentService;
import com.privod.platform.modules.recruitment.web.dto.ApplicantResponse;
import com.privod.platform.modules.recruitment.web.dto.CreateApplicantRequest;
import com.privod.platform.modules.recruitment.web.dto.CreateJobPositionRequest;
import com.privod.platform.modules.recruitment.web.dto.InterviewResponse;
import com.privod.platform.modules.recruitment.web.dto.JobPositionResponse;
import com.privod.platform.modules.recruitment.web.dto.ScheduleInterviewRequest;
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
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class RecruitmentServiceTest {

    @Mock
    private ApplicantRepository applicantRepository;

    @Mock
    private JobPositionRepository jobPositionRepository;

    @Mock
    private RecruitmentStageRepository stageRepository;

    @Mock
    private InterviewRepository interviewRepository;

    @Mock
    private AuditService auditService;

    @InjectMocks
    private RecruitmentService recruitmentService;

    private UUID applicantId;
    private UUID jobPositionId;
    private UUID departmentId;
    private Applicant testApplicant;
    private JobPosition testJobPosition;

    @BeforeEach
    void setUp() {
        applicantId = UUID.randomUUID();
        jobPositionId = UUID.randomUUID();
        departmentId = UUID.randomUUID();

        testJobPosition = JobPosition.builder()
                .name("Инженер-строитель")
                .departmentId(departmentId)
                .description("Строительные работы")
                .requirements("Опыт от 3 лет")
                .expectedEmployees(3)
                .hiredEmployees(0)
                .status(JobPositionStatus.OPEN)
                .deadline(LocalDate.of(2025, 12, 31))
                .build();
        testJobPosition.setId(jobPositionId);
        testJobPosition.setCreatedAt(Instant.now());

        testApplicant = Applicant.builder()
                .partnerName("Иванов Иван Иванович")
                .email("ivanov@example.com")
                .phone("+7 999 123 4567")
                .jobPositionId(jobPositionId)
                .source("HeadHunter")
                .priority(ApplicantPriority.GOOD)
                .salary(new BigDecimal("150000"))
                .salaryCurrency("RUB")
                .status(ApplicantStatus.NEW)
                .build();
        testApplicant.setId(applicantId);
        testApplicant.setCreatedAt(Instant.now());
    }

    @Nested
    @DisplayName("Create Applicant")
    class CreateApplicantTests {

        @Test
        @DisplayName("Should create applicant with NEW status and default NORMAL priority when not specified")
        void createApplicant_NullPriority_SetsDefaults() {
            CreateApplicantRequest request = new CreateApplicantRequest(
                    "Петров П.П.", "petrov@example.com", "+7 999 000 0000",
                    jobPositionId, null, "LinkedIn", null,
                    null, new BigDecimal("120000"), "RUB",
                    LocalDate.of(2025, 6, 1), "Описание", null);

            when(applicantRepository.save(any(Applicant.class))).thenAnswer(invocation -> {
                Applicant a = invocation.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            ApplicantResponse response = recruitmentService.createApplicant(request);

            assertThat(response.status()).isEqualTo(ApplicantStatus.NEW);
            assertThat(response.priority()).isEqualTo(ApplicantPriority.NORMAL);
            assertThat(response.partnerName()).isEqualTo("Петров П.П.");
            verify(auditService).logCreate(eq("Applicant"), any(UUID.class));
        }

        @Test
        @DisplayName("Should create applicant with explicit EXCELLENT priority")
        void createApplicant_WithPriority_UsesProvidedValue() {
            CreateApplicantRequest request = new CreateApplicantRequest(
                    "Сидоров С.С.", "sidorov@example.com", null,
                    jobPositionId, null, "Referral", null,
                    ApplicantPriority.EXCELLENT, new BigDecimal("200000"), "RUB",
                    null, null, "Рекомендован руководителем");

            when(applicantRepository.save(any(Applicant.class))).thenAnswer(invocation -> {
                Applicant a = invocation.getArgument(0);
                a.setId(UUID.randomUUID());
                a.setCreatedAt(Instant.now());
                return a;
            });

            ApplicantResponse response = recruitmentService.createApplicant(request);

            assertThat(response.priority()).isEqualTo(ApplicantPriority.EXCELLENT);
        }
    }

    @Nested
    @DisplayName("Update Applicant Status")
    class UpdateApplicantStatusTests {

        @Test
        @DisplayName("Should update applicant status from NEW to FIRST_INTERVIEW")
        void updateApplicantStatus_ValidTransition_UpdatesStatus() {
            when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(testApplicant));
            when(applicantRepository.save(any(Applicant.class))).thenAnswer(inv -> inv.getArgument(0));

            ApplicantResponse response = recruitmentService.updateApplicantStatus(
                    applicantId, ApplicantStatus.FIRST_INTERVIEW);

            assertThat(response.status()).isEqualTo(ApplicantStatus.FIRST_INTERVIEW);
            verify(auditService).logUpdate("Applicant", applicantId, "status", "NEW", "FIRST_INTERVIEW");
        }

        @Test
        @DisplayName("Should increment hiredEmployees on job position when applicant status set to WON")
        void updateApplicantStatus_Won_IncrementsHiredEmployees() {
            when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(testApplicant));
            when(applicantRepository.save(any(Applicant.class))).thenAnswer(inv -> inv.getArgument(0));
            when(jobPositionRepository.findById(jobPositionId)).thenReturn(Optional.of(testJobPosition));

            ApplicantResponse response = recruitmentService.updateApplicantStatus(
                    applicantId, ApplicantStatus.WON);

            assertThat(response.status()).isEqualTo(ApplicantStatus.WON);
            assertThat(testJobPosition.getHiredEmployees()).isEqualTo(1);
            assertThat(testJobPosition.getStatus()).isEqualTo(JobPositionStatus.OPEN);
            verify(jobPositionRepository).save(testJobPosition);
        }

        @Test
        @DisplayName("Should close job position when hired reaches expected on WON status")
        void updateApplicantStatus_Won_ClosesPositionWhenFull() {
            testJobPosition.setHiredEmployees(2);
            testJobPosition.setExpectedEmployees(3);

            when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(testApplicant));
            when(applicantRepository.save(any(Applicant.class))).thenAnswer(inv -> inv.getArgument(0));
            when(jobPositionRepository.findById(jobPositionId)).thenReturn(Optional.of(testJobPosition));

            recruitmentService.updateApplicantStatus(applicantId, ApplicantStatus.WON);

            assertThat(testJobPosition.getHiredEmployees()).isEqualTo(3);
            assertThat(testJobPosition.getStatus()).isEqualTo(JobPositionStatus.CLOSED);
        }

        @Test
        @DisplayName("Should not touch job position when status is not WON")
        void updateApplicantStatus_NotWon_DoesNotModifyJobPosition() {
            when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(testApplicant));
            when(applicantRepository.save(any(Applicant.class))).thenAnswer(inv -> inv.getArgument(0));

            recruitmentService.updateApplicantStatus(applicantId, ApplicantStatus.REFUSED);

            verify(jobPositionRepository, never()).findById(any());
            verify(jobPositionRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException for non-existing applicant")
        void updateApplicantStatus_NotFound_ThrowsException() {
            UUID missingId = UUID.randomUUID();
            when(applicantRepository.findById(missingId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> recruitmentService.updateApplicantStatus(missingId, ApplicantStatus.WON))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Кандидат не найден");
        }
    }

    @Nested
    @DisplayName("Create Job Position")
    class CreateJobPositionTests {

        @Test
        @DisplayName("Should create job position with OPEN status and hiredEmployees=0")
        void createJobPosition_Success_SetsDefaults() {
            CreateJobPositionRequest request = new CreateJobPositionRequest(
                    "Прораб", departmentId, "Управление объектом",
                    "Опыт от 5 лет", 2, LocalDate.of(2025, 12, 31));

            when(jobPositionRepository.save(any(JobPosition.class))).thenAnswer(invocation -> {
                JobPosition jp = invocation.getArgument(0);
                jp.setId(UUID.randomUUID());
                jp.setCreatedAt(Instant.now());
                return jp;
            });

            JobPositionResponse response = recruitmentService.createJobPosition(request);

            assertThat(response.name()).isEqualTo("Прораб");
            assertThat(response.status()).isEqualTo(JobPositionStatus.OPEN);
            assertThat(response.hiredEmployees()).isEqualTo(0);
            assertThat(response.expectedEmployees()).isEqualTo(2);
            verify(auditService).logCreate(eq("JobPosition"), any(UUID.class));
        }
    }

    @Nested
    @DisplayName("Schedule Interview")
    class ScheduleInterviewTests {

        @Test
        @DisplayName("Should schedule interview with provided duration")
        void scheduleInterview_ValidApplicant_CreatesInterview() {
            UUID interviewerId = UUID.randomUUID();
            LocalDateTime scheduledAt = LocalDateTime.of(2025, 6, 15, 10, 0);
            ScheduleInterviewRequest request = new ScheduleInterviewRequest(
                    applicantId, interviewerId, scheduledAt, 90, "Офис, каб. 305", "Техническое интервью");

            when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(testApplicant));
            when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> {
                Interview i = invocation.getArgument(0);
                i.setId(UUID.randomUUID());
                i.setCreatedAt(Instant.now());
                return i;
            });

            InterviewResponse response = recruitmentService.scheduleInterview(request);

            assertThat(response.applicantId()).isEqualTo(applicantId);
            assertThat(response.duration()).isEqualTo(90);
            assertThat(response.location()).isEqualTo("Офис, каб. 305");
            verify(auditService).logCreate(eq("Interview"), any(UUID.class));
        }

        @Test
        @DisplayName("Should default duration to 60 when zero is passed")
        void scheduleInterview_ZeroDuration_DefaultsTo60() {
            ScheduleInterviewRequest request = new ScheduleInterviewRequest(
                    applicantId, UUID.randomUUID(),
                    LocalDateTime.of(2025, 7, 1, 14, 0),
                    0, null, null);

            when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(testApplicant));
            when(interviewRepository.save(any(Interview.class))).thenAnswer(invocation -> {
                Interview i = invocation.getArgument(0);
                i.setId(UUID.randomUUID());
                i.setCreatedAt(Instant.now());
                return i;
            });

            InterviewResponse response = recruitmentService.scheduleInterview(request);

            assertThat(response.duration()).isEqualTo(60);
        }

        @Test
        @DisplayName("Should throw EntityNotFoundException when applicant not found")
        void scheduleInterview_ApplicantNotFound_ThrowsException() {
            UUID missingApplicantId = UUID.randomUUID();
            ScheduleInterviewRequest request = new ScheduleInterviewRequest(
                    missingApplicantId, UUID.randomUUID(),
                    LocalDateTime.of(2025, 7, 1, 14, 0),
                    60, null, null);

            when(applicantRepository.findById(missingApplicantId)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> recruitmentService.scheduleInterview(request))
                    .isInstanceOf(EntityNotFoundException.class)
                    .hasMessageContaining("Кандидат не найден");
        }
    }

    @Nested
    @DisplayName("Delete Applicant")
    class DeleteApplicantTests {

        @Test
        @DisplayName("Should soft-delete applicant and log audit")
        void deleteApplicant_ExistingApplicant_SoftDeletes() {
            when(applicantRepository.findById(applicantId)).thenReturn(Optional.of(testApplicant));
            when(applicantRepository.save(any(Applicant.class))).thenAnswer(inv -> inv.getArgument(0));

            recruitmentService.deleteApplicant(applicantId);

            assertThat(testApplicant.isDeleted()).isTrue();
            verify(applicantRepository).save(testApplicant);
            verify(auditService).logDelete("Applicant", applicantId);
        }
    }
}
