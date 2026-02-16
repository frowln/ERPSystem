package com.privod.platform.modules.analytics.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.analytics.domain.ExecutionStatus;
import com.privod.platform.modules.analytics.domain.OutputFormat;
import com.privod.platform.modules.analytics.domain.ReportExecution;
import com.privod.platform.modules.analytics.domain.RunStatus;
import com.privod.platform.modules.analytics.domain.SavedReport;
import com.privod.platform.modules.analytics.repository.ReportExecutionRepository;
import com.privod.platform.modules.analytics.repository.SavedReportRepository;
import com.privod.platform.modules.analytics.web.dto.CreateReportRequest;
import com.privod.platform.modules.analytics.web.dto.ExecuteReportRequest;
import com.privod.platform.modules.analytics.web.dto.ReportExecutionResponse;
import com.privod.platform.modules.analytics.web.dto.SavedReportResponse;
import com.privod.platform.modules.analytics.web.dto.UpdateReportRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsSavedReportService {

    private final SavedReportRepository reportRepository;
    private final ReportExecutionRepository executionRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public SavedReportResponse findById(UUID id) {
        SavedReport report = getReportOrThrow(id);
        return SavedReportResponse.fromEntity(report);
    }

    @Transactional(readOnly = true)
    public Page<SavedReportResponse> findAll(Pageable pageable) {
        return reportRepository.findByDeletedFalse(pageable)
                .map(SavedReportResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<SavedReportResponse> findByCreator(UUID createdById, Pageable pageable) {
        return reportRepository.findByCreatedByIdAndDeletedFalse(createdById, pageable)
                .map(SavedReportResponse::fromEntity);
    }

    @Transactional
    public SavedReportResponse create(CreateReportRequest request) {
        String code = generateReportCode();

        SavedReport report = SavedReport.builder()
                .code(code)
                .name(request.name())
                .description(request.description())
                .reportType(request.reportType())
                .queryConfig(request.queryConfig() != null ? request.queryConfig() : "{}")
                .outputFormat(request.outputFormat() != null ? request.outputFormat() : OutputFormat.PDF)
                .scheduleEnabled(request.scheduleEnabled() != null && request.scheduleEnabled())
                .scheduleCron(request.scheduleCron())
                .scheduleRecipients(request.scheduleRecipients() != null ? request.scheduleRecipients() : "[]")
                .createdById(request.createdById())
                .build();

        report = reportRepository.save(report);
        auditService.logCreate("SavedReport", report.getId());

        log.info("Report created: {} - {} ({})", report.getCode(), report.getName(), report.getId());
        return SavedReportResponse.fromEntity(report);
    }

    @Transactional
    public SavedReportResponse update(UUID id, UpdateReportRequest request) {
        SavedReport report = getReportOrThrow(id);

        if (request.name() != null) {
            report.setName(request.name());
        }
        if (request.description() != null) {
            report.setDescription(request.description());
        }
        if (request.reportType() != null) {
            report.setReportType(request.reportType());
        }
        if (request.queryConfig() != null) {
            report.setQueryConfig(request.queryConfig());
        }
        if (request.outputFormat() != null) {
            report.setOutputFormat(request.outputFormat());
        }
        if (request.scheduleEnabled() != null) {
            report.setScheduleEnabled(request.scheduleEnabled());
        }
        if (request.scheduleCron() != null) {
            report.setScheduleCron(request.scheduleCron());
        }
        if (request.scheduleRecipients() != null) {
            report.setScheduleRecipients(request.scheduleRecipients());
        }

        report = reportRepository.save(report);
        auditService.logUpdate("SavedReport", report.getId(), "multiple", null, null);

        log.info("Report updated: {} ({})", report.getCode(), report.getId());
        return SavedReportResponse.fromEntity(report);
    }

    @Transactional
    public ReportExecutionResponse executeReport(UUID reportId, ExecuteReportRequest request) {
        SavedReport report = getReportOrThrow(reportId);

        ReportExecution execution = ReportExecution.builder()
                .reportId(reportId)
                .executedById(request.executedById())
                .startedAt(Instant.now())
                .status(ExecutionStatus.PENDING)
                .parametersJson(request.parametersJson() != null ? request.parametersJson() : "{}")
                .build();

        execution = executionRepository.save(execution);

        // Simulate report execution
        try {
            execution.setStatus(ExecutionStatus.RUNNING);
            execution = executionRepository.save(execution);

            String outputUrl = String.format("/reports/output/%s/%s.%s",
                    reportId, execution.getId(), report.getOutputFormat().name().toLowerCase());

            execution.setStatus(ExecutionStatus.COMPLETED);
            execution.setCompletedAt(Instant.now());
            execution.setOutputUrl(outputUrl);
            execution.setOutputSize(1024L);
            execution = executionRepository.save(execution);

            report.setLastRunAt(Instant.now());
            report.setLastRunStatus(RunStatus.SUCCESS);
            reportRepository.save(report);

            log.info("Report executed successfully: {} execution={}", report.getCode(), execution.getId());
        } catch (Exception e) {
            execution.setStatus(ExecutionStatus.FAILED);
            execution.setCompletedAt(Instant.now());
            execution.setErrorMessage(e.getMessage());
            executionRepository.save(execution);

            report.setLastRunAt(Instant.now());
            report.setLastRunStatus(RunStatus.FAILED);
            reportRepository.save(report);

            log.error("Report execution failed: {} execution={}", report.getCode(), execution.getId(), e);
        }

        return ReportExecutionResponse.fromEntity(execution);
    }

    @Transactional
    public SavedReportResponse scheduleReport(UUID reportId, String cronExpression, String recipients) {
        SavedReport report = getReportOrThrow(reportId);

        report.setScheduleEnabled(true);
        report.setScheduleCron(cronExpression);
        if (recipients != null) {
            report.setScheduleRecipients(recipients);
        }

        report = reportRepository.save(report);
        auditService.logUpdate("SavedReport", report.getId(), "schedule", null, cronExpression);

        log.info("Report scheduled: {} cron={}", report.getCode(), cronExpression);
        return SavedReportResponse.fromEntity(report);
    }

    @Transactional(readOnly = true)
    public Page<ReportExecutionResponse> getExecutionHistory(UUID reportId, Pageable pageable) {
        getReportOrThrow(reportId);
        return executionRepository.findByReportIdAndDeletedFalseOrderByStartedAtDesc(reportId, pageable)
                .map(ReportExecutionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<SavedReportResponse> getScheduledReports() {
        return reportRepository.findByScheduleEnabledTrueAndDeletedFalse()
                .stream()
                .map(SavedReportResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void delete(UUID id) {
        SavedReport report = getReportOrThrow(id);
        report.softDelete();
        reportRepository.save(report);
        auditService.logDelete("SavedReport", id);
        log.info("Report soft-deleted: {} ({})", report.getCode(), id);
    }

    private SavedReport getReportOrThrow(UUID id) {
        return reportRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Отчёт не найден: " + id));
    }

    private String generateReportCode() {
        long seq = reportRepository.getNextCodeSequence();
        return String.format("RPT-%05d", seq);
    }
}
