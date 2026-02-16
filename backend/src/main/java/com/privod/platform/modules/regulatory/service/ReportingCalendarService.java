package com.privod.platform.modules.regulatory.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.regulatory.domain.DeadlineStatus;
import com.privod.platform.modules.regulatory.domain.ReportingDeadline;
import com.privod.platform.modules.regulatory.domain.ReportingFrequency;
import com.privod.platform.modules.regulatory.domain.ReportingSubmission;
import com.privod.platform.modules.regulatory.domain.SubmissionChannel;
import com.privod.platform.modules.regulatory.repository.ReportingDeadlineRepository;
import com.privod.platform.modules.regulatory.repository.ReportingSubmissionRepository;
import com.privod.platform.modules.regulatory.web.dto.CreateReportingDeadlineRequest;
import com.privod.platform.modules.regulatory.web.dto.CreateReportingSubmissionRequest;
import com.privod.platform.modules.regulatory.web.dto.ReportingDeadlineResponse;
import com.privod.platform.modules.regulatory.web.dto.ReportingSubmissionResponse;
import com.privod.platform.modules.regulatory.web.dto.UpdateReportingDeadlineRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportingCalendarService {

    private final ReportingDeadlineRepository deadlineRepository;
    private final ReportingSubmissionRepository submissionRepository;
    private final AuditService auditService;

    // --- Deadline operations ---

    @Transactional(readOnly = true)
    public ReportingDeadlineResponse findDeadlineById(UUID id) {
        ReportingDeadline deadline = getDeadlineOrThrow(id);
        return ReportingDeadlineResponse.fromEntity(deadline);
    }

    @Transactional(readOnly = true)
    public Page<ReportingDeadlineResponse> findAllDeadlines(Pageable pageable) {
        return deadlineRepository.findByDeletedFalseOrderByDueDateAsc(pageable)
                .map(ReportingDeadlineResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ReportingDeadlineResponse> findDeadlinesByFilters(DeadlineStatus status, String reportType,
                                                                    String regulatoryBody, LocalDate from,
                                                                    LocalDate to, Pageable pageable) {
        return deadlineRepository.findByFilters(status, reportType, regulatoryBody, from, to, pageable)
                .map(ReportingDeadlineResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<ReportingDeadlineResponse> findUpcomingDeadlines(int daysAhead) {
        LocalDate reminderDate = LocalDate.now().plusDays(daysAhead);
        return deadlineRepository.findUpcomingDeadlines(reminderDate)
                .stream()
                .map(ReportingDeadlineResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ReportingDeadlineResponse> findOverdueDeadlines() {
        return deadlineRepository.findOverdueDeadlines(LocalDate.now())
                .stream()
                .map(ReportingDeadlineResponse::fromEntity)
                .toList();
    }

    @Transactional
    public ReportingDeadlineResponse createDeadline(CreateReportingDeadlineRequest request) {
        ReportingDeadline deadline = ReportingDeadline.builder()
                .name(request.name())
                .reportType(request.reportType())
                .frequency(request.frequency() != null ? request.frequency() : ReportingFrequency.MONTHLY)
                .dueDate(request.dueDate())
                .reminderDaysBefore(request.reminderDaysBefore() != null ? request.reminderDaysBefore() : 5)
                .responsibleId(request.responsibleId())
                .status(DeadlineStatus.UPCOMING)
                .notes(request.notes())
                .regulatoryBody(request.regulatoryBody())
                .penaltyAmount(request.penaltyAmount())
                .build();

        deadline = deadlineRepository.save(deadline);
        auditService.logCreate("ReportingDeadline", deadline.getId());

        log.info("Reporting deadline created: {} - {} due {} ({})",
                deadline.getName(), deadline.getReportType(), deadline.getDueDate(), deadline.getId());
        return ReportingDeadlineResponse.fromEntity(deadline);
    }

    @Transactional
    public ReportingDeadlineResponse updateDeadline(UUID id, UpdateReportingDeadlineRequest request) {
        ReportingDeadline deadline = getDeadlineOrThrow(id);

        if (request.name() != null) {
            deadline.setName(request.name());
        }
        if (request.reportType() != null) {
            deadline.setReportType(request.reportType());
        }
        if (request.frequency() != null) {
            deadline.setFrequency(request.frequency());
        }
        if (request.dueDate() != null) {
            deadline.setDueDate(request.dueDate());
        }
        if (request.reminderDaysBefore() != null) {
            deadline.setReminderDaysBefore(request.reminderDaysBefore());
        }
        if (request.responsibleId() != null) {
            deadline.setResponsibleId(request.responsibleId());
        }
        if (request.status() != null) {
            DeadlineStatus oldStatus = deadline.getStatus();
            deadline.setStatus(request.status());
            auditService.logStatusChange("ReportingDeadline", deadline.getId(),
                    oldStatus.name(), request.status().name());
        }
        if (request.notes() != null) {
            deadline.setNotes(request.notes());
        }
        if (request.regulatoryBody() != null) {
            deadline.setRegulatoryBody(request.regulatoryBody());
        }
        if (request.penaltyAmount() != null) {
            deadline.setPenaltyAmount(request.penaltyAmount());
        }

        deadline = deadlineRepository.save(deadline);
        auditService.logUpdate("ReportingDeadline", deadline.getId(), "multiple", null, null);

        log.info("Reporting deadline updated: {} ({})", deadline.getName(), deadline.getId());
        return ReportingDeadlineResponse.fromEntity(deadline);
    }

    @Transactional
    public ReportingDeadlineResponse markAsSubmitted(UUID id, UUID submittedById) {
        ReportingDeadline deadline = getDeadlineOrThrow(id);

        DeadlineStatus oldStatus = deadline.getStatus();
        deadline.setStatus(DeadlineStatus.SUBMITTED);
        deadline.setSubmittedAt(Instant.now());
        deadline.setSubmittedById(submittedById);

        deadline = deadlineRepository.save(deadline);
        auditService.logStatusChange("ReportingDeadline", deadline.getId(),
                oldStatus.name(), DeadlineStatus.SUBMITTED.name());

        log.info("Reporting deadline marked as submitted: {} ({})", deadline.getName(), deadline.getId());
        return ReportingDeadlineResponse.fromEntity(deadline);
    }

    @Transactional
    public void deleteDeadline(UUID id) {
        ReportingDeadline deadline = getDeadlineOrThrow(id);
        deadline.softDelete();
        deadlineRepository.save(deadline);
        auditService.logDelete("ReportingDeadline", id);
        log.info("Reporting deadline soft-deleted: {} ({})", deadline.getName(), id);
    }

    // --- Submission operations ---

    @Transactional(readOnly = true)
    public ReportingSubmissionResponse findSubmissionById(UUID id) {
        ReportingSubmission submission = getSubmissionOrThrow(id);
        return ReportingSubmissionResponse.fromEntity(submission);
    }

    @Transactional(readOnly = true)
    public Page<ReportingSubmissionResponse> findSubmissionsByDeadline(UUID deadlineId, Pageable pageable) {
        return submissionRepository.findByDeadlineIdAndDeletedFalseOrderBySubmissionDateDesc(deadlineId, pageable)
                .map(ReportingSubmissionResponse::fromEntity);
    }

    @Transactional
    public ReportingSubmissionResponse createSubmission(CreateReportingSubmissionRequest request) {
        getDeadlineOrThrow(request.deadlineId());

        ReportingSubmission submission = ReportingSubmission.builder()
                .deadlineId(request.deadlineId())
                .submissionDate(request.submissionDate())
                .submittedById(request.submittedById())
                .confirmationNumber(request.confirmationNumber())
                .channel(request.channel() != null ? request.channel() : SubmissionChannel.ELECTRONIC)
                .fileUrl(request.fileUrl())
                .build();

        submission = submissionRepository.save(submission);
        auditService.logCreate("ReportingSubmission", submission.getId());

        log.info("Reporting submission created for deadline {}: {} ({})",
                request.deadlineId(), submission.getSubmissionDate(), submission.getId());
        return ReportingSubmissionResponse.fromEntity(submission);
    }

    private ReportingDeadline getDeadlineOrThrow(UUID id) {
        return deadlineRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Дедлайн отчётности не найден: " + id));
    }

    private ReportingSubmission getSubmissionOrThrow(UUID id) {
        return submissionRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Подача отчётности не найдена: " + id));
    }
}
