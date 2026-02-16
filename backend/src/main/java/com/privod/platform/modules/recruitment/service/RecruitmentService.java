package com.privod.platform.modules.recruitment.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.recruitment.domain.Applicant;
import com.privod.platform.modules.recruitment.domain.ApplicantPriority;
import com.privod.platform.modules.recruitment.domain.ApplicantStatus;
import com.privod.platform.modules.recruitment.domain.Interview;
import com.privod.platform.modules.recruitment.domain.JobPosition;
import com.privod.platform.modules.recruitment.domain.JobPositionStatus;
import com.privod.platform.modules.recruitment.domain.RecruitmentStage;
import com.privod.platform.modules.recruitment.repository.ApplicantRepository;
import com.privod.platform.modules.recruitment.repository.InterviewRepository;
import com.privod.platform.modules.recruitment.repository.JobPositionRepository;
import com.privod.platform.modules.recruitment.repository.RecruitmentStageRepository;
import com.privod.platform.modules.recruitment.web.dto.ApplicantResponse;
import com.privod.platform.modules.recruitment.web.dto.CreateApplicantRequest;
import com.privod.platform.modules.recruitment.web.dto.CreateJobPositionRequest;
import com.privod.platform.modules.recruitment.web.dto.InterviewResponse;
import com.privod.platform.modules.recruitment.web.dto.JobPositionResponse;
import com.privod.platform.modules.recruitment.web.dto.ScheduleInterviewRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecruitmentService {

    private final ApplicantRepository applicantRepository;
    private final JobPositionRepository jobPositionRepository;
    private final RecruitmentStageRepository stageRepository;
    private final InterviewRepository interviewRepository;
    private final AuditService auditService;

    // ---- Applicants ----

    @Transactional(readOnly = true)
    public Page<ApplicantResponse> listApplicants(String search, ApplicantStatus status,
                                                   UUID jobPositionId, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return applicantRepository.search(search, pageable).map(ApplicantResponse::fromEntity);
        }
        if (status != null) {
            return applicantRepository.findByStatusAndDeletedFalse(status, pageable).map(ApplicantResponse::fromEntity);
        }
        if (jobPositionId != null) {
            return applicantRepository.findByJobPositionIdAndDeletedFalse(jobPositionId, pageable)
                    .map(ApplicantResponse::fromEntity);
        }
        return applicantRepository.findAll(pageable).map(ApplicantResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ApplicantResponse getApplicant(UUID id) {
        Applicant applicant = getApplicantOrThrow(id);
        return ApplicantResponse.fromEntity(applicant);
    }

    @Transactional
    public ApplicantResponse createApplicant(CreateApplicantRequest request) {
        Applicant applicant = Applicant.builder()
                .partnerName(request.partnerName())
                .email(request.email())
                .phone(request.phone())
                .jobPositionId(request.jobPositionId())
                .stageId(request.stageId())
                .source(request.source())
                .medium(request.medium())
                .priority(request.priority() != null ? request.priority() : ApplicantPriority.NORMAL)
                .salary(request.salary())
                .salaryCurrency(request.salaryCurrency())
                .availability(request.availability())
                .description(request.description())
                .interviewNotes(request.interviewNotes())
                .status(ApplicantStatus.NEW)
                .build();

        applicant = applicantRepository.save(applicant);
        auditService.logCreate("Applicant", applicant.getId());

        log.info("Applicant created: {} ({})", applicant.getPartnerName(), applicant.getId());
        return ApplicantResponse.fromEntity(applicant);
    }

    @Transactional
    public ApplicantResponse updateApplicantStage(UUID id, UUID stageId) {
        Applicant applicant = getApplicantOrThrow(id);
        UUID oldStageId = applicant.getStageId();
        applicant.setStageId(stageId);
        applicant = applicantRepository.save(applicant);
        auditService.logUpdate("Applicant", applicant.getId(), "stageId",
                oldStageId != null ? oldStageId.toString() : null,
                stageId != null ? stageId.toString() : null);

        log.info("Applicant stage updated: {} -> stage {}", applicant.getPartnerName(), stageId);
        return ApplicantResponse.fromEntity(applicant);
    }

    @Transactional
    public ApplicantResponse updateApplicantStatus(UUID id, ApplicantStatus newStatus) {
        Applicant applicant = getApplicantOrThrow(id);
        String oldStatus = applicant.getStatus().name();
        applicant.setStatus(newStatus);

        if (newStatus == ApplicantStatus.WON && applicant.getJobPositionId() != null) {
            jobPositionRepository.findById(applicant.getJobPositionId())
                    .filter(jp -> !jp.isDeleted())
                    .ifPresent(jp -> {
                        jp.setHiredEmployees(jp.getHiredEmployees() + 1);
                        if (jp.getHiredEmployees() >= jp.getExpectedEmployees()) {
                            jp.setStatus(JobPositionStatus.CLOSED);
                        }
                        jobPositionRepository.save(jp);
                    });
        }

        applicant = applicantRepository.save(applicant);
        auditService.logUpdate("Applicant", applicant.getId(), "status", oldStatus, newStatus.name());

        log.info("Applicant status changed: {} ({}) {} -> {}", applicant.getPartnerName(),
                applicant.getId(), oldStatus, newStatus);
        return ApplicantResponse.fromEntity(applicant);
    }

    @Transactional
    public void deleteApplicant(UUID id) {
        Applicant applicant = getApplicantOrThrow(id);
        applicant.softDelete();
        applicantRepository.save(applicant);
        auditService.logDelete("Applicant", id);
        log.info("Applicant soft-deleted: {} ({})", applicant.getPartnerName(), id);
    }

    // ---- Job Positions ----

    @Transactional(readOnly = true)
    public Page<JobPositionResponse> listJobPositions(String search, JobPositionStatus status,
                                                       UUID departmentId, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return jobPositionRepository.search(search, pageable).map(JobPositionResponse::fromEntity);
        }
        if (status != null) {
            return jobPositionRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(JobPositionResponse::fromEntity);
        }
        if (departmentId != null) {
            return jobPositionRepository.findByDepartmentIdAndDeletedFalse(departmentId, pageable)
                    .map(JobPositionResponse::fromEntity);
        }
        return jobPositionRepository.findAll(pageable).map(JobPositionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public JobPositionResponse getJobPosition(UUID id) {
        JobPosition jp = getJobPositionOrThrow(id);
        return JobPositionResponse.fromEntity(jp);
    }

    @Transactional
    public JobPositionResponse createJobPosition(CreateJobPositionRequest request) {
        JobPosition jp = JobPosition.builder()
                .name(request.name())
                .departmentId(request.departmentId())
                .description(request.description())
                .requirements(request.requirements())
                .expectedEmployees(request.expectedEmployees())
                .hiredEmployees(0)
                .status(JobPositionStatus.OPEN)
                .deadline(request.deadline())
                .build();

        jp = jobPositionRepository.save(jp);
        auditService.logCreate("JobPosition", jp.getId());

        log.info("Job position created: {} ({})", jp.getName(), jp.getId());
        return JobPositionResponse.fromEntity(jp);
    }

    @Transactional
    public JobPositionResponse updateJobPositionStatus(UUID id, JobPositionStatus newStatus) {
        JobPosition jp = getJobPositionOrThrow(id);
        String oldStatus = jp.getStatus().name();
        jp.setStatus(newStatus);
        jp = jobPositionRepository.save(jp);
        auditService.logUpdate("JobPosition", jp.getId(), "status", oldStatus, newStatus.name());

        log.info("Job position status changed: {} ({}) {} -> {}", jp.getName(), jp.getId(), oldStatus, newStatus);
        return JobPositionResponse.fromEntity(jp);
    }

    @Transactional
    public void deleteJobPosition(UUID id) {
        JobPosition jp = getJobPositionOrThrow(id);
        jp.softDelete();
        jobPositionRepository.save(jp);
        auditService.logDelete("JobPosition", id);
        log.info("Job position soft-deleted: {} ({})", jp.getName(), id);
    }

    // ---- Stages ----

    @Transactional(readOnly = true)
    public List<RecruitmentStage> listStages() {
        return stageRepository.findByDeletedFalseOrderBySequenceAsc();
    }

    // ---- Interviews ----

    @Transactional(readOnly = true)
    public Page<InterviewResponse> listInterviews(UUID applicantId, UUID interviewerId, Pageable pageable) {
        if (applicantId != null) {
            return interviewRepository.findByApplicantIdAndDeletedFalse(applicantId, pageable)
                    .map(InterviewResponse::fromEntity);
        }
        if (interviewerId != null) {
            return interviewRepository.findByInterviewerIdAndDeletedFalse(interviewerId, pageable)
                    .map(InterviewResponse::fromEntity);
        }
        return interviewRepository.findByDeletedFalse(pageable).map(InterviewResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public InterviewResponse getInterview(UUID id) {
        Interview interview = getInterviewOrThrow(id);
        return InterviewResponse.fromEntity(interview);
    }

    @Transactional
    public InterviewResponse scheduleInterview(ScheduleInterviewRequest request) {
        getApplicantOrThrow(request.applicantId());

        Interview interview = Interview.builder()
                .applicantId(request.applicantId())
                .interviewerId(request.interviewerId())
                .scheduledAt(request.scheduledAt())
                .duration(request.duration() > 0 ? request.duration() : 60)
                .location(request.location())
                .notes(request.notes())
                .build();

        interview = interviewRepository.save(interview);
        auditService.logCreate("Interview", interview.getId());

        log.info("Interview scheduled for applicant {} at {} ({})",
                request.applicantId(), request.scheduledAt(), interview.getId());
        return InterviewResponse.fromEntity(interview);
    }

    @Transactional
    public InterviewResponse updateInterviewResult(UUID id, com.privod.platform.modules.recruitment.domain.InterviewResult result, String notes) {
        Interview interview = getInterviewOrThrow(id);
        interview.setResult(result);
        if (notes != null) {
            interview.setNotes(notes);
        }
        interview = interviewRepository.save(interview);
        auditService.logUpdate("Interview", interview.getId(), "result", null, result.name());

        log.info("Interview result updated: {} -> {} ({})", interview.getApplicantId(), result, interview.getId());
        return InterviewResponse.fromEntity(interview);
    }

    @Transactional
    public void deleteInterview(UUID id) {
        Interview interview = getInterviewOrThrow(id);
        interview.softDelete();
        interviewRepository.save(interview);
        auditService.logDelete("Interview", id);
        log.info("Interview soft-deleted: {}", id);
    }

    // ---- Private helpers ----

    private Applicant getApplicantOrThrow(UUID id) {
        return applicantRepository.findById(id)
                .filter(a -> !a.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Кандидат не найден: " + id));
    }

    private JobPosition getJobPositionOrThrow(UUID id) {
        return jobPositionRepository.findById(id)
                .filter(jp -> !jp.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Вакансия не найдена: " + id));
    }

    private Interview getInterviewOrThrow(UUID id) {
        return interviewRepository.findById(id)
                .filter(i -> !i.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Собеседование не найдено: " + id));
    }
}
