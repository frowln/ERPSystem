package com.privod.platform.modules.regulatory.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.regulatory.domain.RegulatoryReport;
import com.privod.platform.modules.regulatory.domain.ReportStatus;
import com.privod.platform.modules.regulatory.repository.RegulatoryReportRepository;
import com.privod.platform.modules.regulatory.web.dto.CreateRegulatoryReportRequest;
import com.privod.platform.modules.regulatory.web.dto.RegulatoryReportResponse;
import com.privod.platform.modules.regulatory.web.dto.UpdateRegulatoryReportRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class RegulatoryReportService {

    private final RegulatoryReportRepository reportRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<RegulatoryReportResponse> listReports(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return reportRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(RegulatoryReportResponse::fromEntity);
        }
        return reportRepository.findAll(pageable).map(RegulatoryReportResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public RegulatoryReportResponse getReport(UUID id) {
        RegulatoryReport report = getReportOrThrow(id);
        return RegulatoryReportResponse.fromEntity(report);
    }

    @Transactional
    public RegulatoryReportResponse createReport(CreateRegulatoryReportRequest request) {
        String code = generateReportCode();

        RegulatoryReport report = RegulatoryReport.builder()
                .code(code)
                .projectId(request.projectId())
                .reportType(request.reportType())
                .title(request.title())
                .period(request.period())
                .dueDate(request.dueDate())
                .status(ReportStatus.DRAFT)
                .submittedToOrgan(request.submittedToOrgan())
                .fileUrl(request.fileUrl())
                .preparedById(request.preparedById())
                .build();

        report = reportRepository.save(report);
        auditService.logCreate("RegulatoryReport", report.getId());

        log.info("Regulatory report created: {} - {} ({})", report.getCode(),
                report.getTitle(), report.getId());
        return RegulatoryReportResponse.fromEntity(report);
    }

    @Transactional
    public RegulatoryReportResponse updateReport(UUID id, UpdateRegulatoryReportRequest request) {
        RegulatoryReport report = getReportOrThrow(id);

        if (request.projectId() != null) {
            report.setProjectId(request.projectId());
        }
        if (request.reportType() != null) {
            report.setReportType(request.reportType());
        }
        if (request.title() != null) {
            report.setTitle(request.title());
        }
        if (request.period() != null) {
            report.setPeriod(request.period());
        }
        if (request.dueDate() != null) {
            report.setDueDate(request.dueDate());
        }
        if (request.status() != null) {
            report.setStatus(request.status());
        }
        if (request.submittedToOrgan() != null) {
            report.setSubmittedToOrgan(request.submittedToOrgan());
        }
        if (request.organResponse() != null) {
            report.setOrganResponse(request.organResponse());
        }
        if (request.fileUrl() != null) {
            report.setFileUrl(request.fileUrl());
        }
        if (request.preparedById() != null) {
            report.setPreparedById(request.preparedById());
        }
        if (request.submittedById() != null) {
            report.setSubmittedById(request.submittedById());
        }

        report = reportRepository.save(report);
        auditService.logUpdate("RegulatoryReport", report.getId(), "multiple", null, null);

        log.info("Regulatory report updated: {} ({})", report.getCode(), report.getId());
        return RegulatoryReportResponse.fromEntity(report);
    }

    @Transactional
    public RegulatoryReportResponse submitReport(UUID id, UUID submittedById) {
        RegulatoryReport report = getReportOrThrow(id);

        if (report.getStatus() != ReportStatus.DRAFT && report.getStatus() != ReportStatus.PREPARED) {
            throw new IllegalStateException(
                    String.format("Невозможно отправить отчёт из статуса %s",
                            report.getStatus().getDisplayName()));
        }

        ReportStatus oldStatus = report.getStatus();
        report.setStatus(ReportStatus.SUBMITTED);
        report.setSubmittedAt(Instant.now());
        report.setSubmittedById(submittedById);

        report = reportRepository.save(report);
        auditService.logStatusChange("RegulatoryReport", report.getId(),
                oldStatus.name(), ReportStatus.SUBMITTED.name());

        log.info("Regulatory report submitted: {} ({})", report.getCode(), report.getId());
        return RegulatoryReportResponse.fromEntity(report);
    }

    @Transactional
    public RegulatoryReportResponse acceptReport(UUID id) {
        RegulatoryReport report = getReportOrThrow(id);

        if (report.getStatus() != ReportStatus.SUBMITTED) {
            throw new IllegalStateException(
                    String.format("Принять можно только отправленный отчёт, текущий статус: %s",
                            report.getStatus().getDisplayName()));
        }

        ReportStatus oldStatus = report.getStatus();
        report.setStatus(ReportStatus.ACCEPTED);

        report = reportRepository.save(report);
        auditService.logStatusChange("RegulatoryReport", report.getId(),
                oldStatus.name(), ReportStatus.ACCEPTED.name());

        log.info("Regulatory report accepted: {} ({})", report.getCode(), report.getId());
        return RegulatoryReportResponse.fromEntity(report);
    }

    @Transactional
    public RegulatoryReportResponse rejectReport(UUID id, String reason) {
        RegulatoryReport report = getReportOrThrow(id);

        if (report.getStatus() != ReportStatus.SUBMITTED) {
            throw new IllegalStateException(
                    String.format("Отклонить можно только отправленный отчёт, текущий статус: %s",
                            report.getStatus().getDisplayName()));
        }

        ReportStatus oldStatus = report.getStatus();
        report.setStatus(ReportStatus.REJECTED);
        report.setOrganResponse(reason);

        report = reportRepository.save(report);
        auditService.logStatusChange("RegulatoryReport", report.getId(),
                oldStatus.name(), ReportStatus.REJECTED.name());

        log.info("Regulatory report rejected: {} ({})", report.getCode(), report.getId());
        return RegulatoryReportResponse.fromEntity(report);
    }

    @Transactional
    public void deleteReport(UUID id) {
        RegulatoryReport report = getReportOrThrow(id);
        report.softDelete();
        reportRepository.save(report);
        auditService.logDelete("RegulatoryReport", id);
        log.info("Regulatory report deleted: {} ({})", report.getCode(), id);
    }

    private RegulatoryReport getReportOrThrow(UUID id) {
        return reportRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Регуляторный отчёт не найден: " + id));
    }

    private String generateReportCode() {
        long seq = reportRepository.getNextNumberSequence();
        return String.format("REG-%05d", seq);
    }
}
