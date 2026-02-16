package com.privod.platform.modules.analytics.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.analytics.domain.AnalyticsReport;
import com.privod.platform.modules.analytics.domain.BiReportType;
import com.privod.platform.modules.analytics.repository.AnalyticsReportRepository;
import com.privod.platform.modules.analytics.web.dto.AnalyticsReportResponse;
import com.privod.platform.modules.analytics.web.dto.CreateAnalyticsReportRequest;
import com.privod.platform.modules.analytics.web.dto.UpdateAnalyticsReportRequest;
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
public class AnalyticsReportService {

    private final AnalyticsReportRepository reportRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public AnalyticsReportResponse findById(UUID id) {
        AnalyticsReport report = getReportOrThrow(id);
        return AnalyticsReportResponse.fromEntity(report);
    }

    @Transactional(readOnly = true)
    public Page<AnalyticsReportResponse> findAll(Pageable pageable) {
        return reportRepository.findByDeletedFalseOrderByCreatedAtDesc(pageable)
                .map(AnalyticsReportResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<AnalyticsReportResponse> findByType(BiReportType reportType, Pageable pageable) {
        return reportRepository.findByReportTypeAndDeletedFalseOrderByCreatedAtDesc(reportType, pageable)
                .map(AnalyticsReportResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<AnalyticsReportResponse> findAccessible(UUID userId, Pageable pageable) {
        return reportRepository.findAccessibleReports(userId, pageable)
                .map(AnalyticsReportResponse::fromEntity);
    }

    @Transactional
    public AnalyticsReportResponse create(CreateAnalyticsReportRequest request) {
        AnalyticsReport report = AnalyticsReport.builder()
                .name(request.name())
                .reportType(request.reportType() != null ? request.reportType() : BiReportType.STANDARD)
                .category(request.category())
                .query(request.query())
                .parameters(request.parameters() != null ? request.parameters() : "{}")
                .outputFormat(request.outputFormat() != null ? request.outputFormat() : com.privod.platform.modules.analytics.domain.BiOutputFormat.PDF)
                .createdById(request.createdById())
                .isPublic(request.isPublic() != null && request.isPublic())
                .description(request.description())
                .build();

        report = reportRepository.save(report);
        auditService.logCreate("AnalyticsReport", report.getId());

        log.info("Analytics report created: {} ({})", report.getName(), report.getId());
        return AnalyticsReportResponse.fromEntity(report);
    }

    @Transactional
    public AnalyticsReportResponse update(UUID id, UpdateAnalyticsReportRequest request) {
        AnalyticsReport report = getReportOrThrow(id);

        if (request.name() != null) {
            report.setName(request.name());
        }
        if (request.reportType() != null) {
            report.setReportType(request.reportType());
        }
        if (request.category() != null) {
            report.setCategory(request.category());
        }
        if (request.query() != null) {
            report.setQuery(request.query());
        }
        if (request.parameters() != null) {
            report.setParameters(request.parameters());
        }
        if (request.outputFormat() != null) {
            report.setOutputFormat(request.outputFormat());
        }
        if (request.isPublic() != null) {
            report.setPublic(request.isPublic());
        }
        if (request.description() != null) {
            report.setDescription(request.description());
        }

        report = reportRepository.save(report);
        auditService.logUpdate("AnalyticsReport", report.getId(), "multiple", null, null);

        log.info("Analytics report updated: {} ({})", report.getName(), report.getId());
        return AnalyticsReportResponse.fromEntity(report);
    }

    @Transactional
    public AnalyticsReportResponse runReport(UUID id) {
        AnalyticsReport report = getReportOrThrow(id);
        report.setLastRunAt(Instant.now());
        report.setRunCount(report.getRunCount() + 1);

        report = reportRepository.save(report);
        log.info("Analytics report executed: {} ({}), run #{}", report.getName(), report.getId(), report.getRunCount());
        return AnalyticsReportResponse.fromEntity(report);
    }

    @Transactional
    public void delete(UUID id) {
        AnalyticsReport report = getReportOrThrow(id);
        report.softDelete();
        reportRepository.save(report);
        auditService.logDelete("AnalyticsReport", id);
        log.info("Analytics report soft-deleted: {} ({})", report.getName(), id);
    }

    private AnalyticsReport getReportOrThrow(UUID id) {
        return reportRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Аналитический отчёт не найден: " + id));
    }
}
