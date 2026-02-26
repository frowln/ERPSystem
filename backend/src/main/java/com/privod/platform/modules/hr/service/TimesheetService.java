package com.privod.platform.modules.hr.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.hr.domain.Timesheet;
import com.privod.platform.modules.hr.domain.TimesheetStatus;
import com.privod.platform.modules.hr.repository.TimesheetRepository;
import com.privod.platform.modules.hr.web.dto.CreateTimesheetRequest;
import com.privod.platform.modules.hr.web.dto.TimesheetResponse;
import com.privod.platform.modules.hr.web.dto.TimesheetSummaryResponse;
import com.privod.platform.modules.hr.web.dto.UpdateTimesheetRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TimesheetService {

    private final TimesheetRepository timesheetRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<TimesheetResponse> listAll(Pageable pageable) {
        return timesheetRepository.findByDeletedFalse(pageable)
                .map(TimesheetResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<TimesheetResponse> listByEmployee(UUID employeeId, Pageable pageable) {
        return timesheetRepository.findByEmployeeIdAndDeletedFalse(employeeId, pageable)
                .map(TimesheetResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<TimesheetResponse> listByProject(UUID projectId, Pageable pageable) {
        return timesheetRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                .map(TimesheetResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public TimesheetResponse getTimesheet(UUID id) {
        Timesheet ts = getTimesheetOrThrow(id);
        return TimesheetResponse.fromEntity(ts);
    }

    @Transactional
    public TimesheetResponse createTimesheet(CreateTimesheetRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        Timesheet ts = Timesheet.builder()
                .organizationId(organizationId)
                .employeeId(request.employeeId())
                .projectId(request.projectId())
                .workDate(request.workDate())
                .hoursWorked(request.hoursWorked())
                .overtimeHours(request.overtimeHours() != null ? request.overtimeHours() : BigDecimal.ZERO)
                .status(TimesheetStatus.DRAFT)
                .notes(request.notes())
                .build();

        ts = timesheetRepository.save(ts);
        auditService.logCreate("Timesheet", ts.getId());

        log.info("Timesheet created for employee {} on {} ({})",
                request.employeeId(), request.workDate(), ts.getId());
        return TimesheetResponse.fromEntity(ts);
    }

    @Transactional
    public TimesheetResponse updateTimesheet(UUID id, UpdateTimesheetRequest request) {
        Timesheet ts = getTimesheetOrThrow(id);

        if (ts.getStatus() != TimesheetStatus.DRAFT && ts.getStatus() != TimesheetStatus.REJECTED) {
            throw new IllegalStateException(
                    "Редактирование табеля возможно только в статусе Черновик или Отклонено");
        }

        if (request.hoursWorked() != null) {
            ts.setHoursWorked(request.hoursWorked());
        }
        if (request.overtimeHours() != null) {
            ts.setOvertimeHours(request.overtimeHours());
        }
        if (request.notes() != null) {
            ts.setNotes(request.notes());
        }

        ts = timesheetRepository.save(ts);
        auditService.logUpdate("Timesheet", ts.getId(), "multiple", null, null);

        log.info("Timesheet updated: {}", ts.getId());
        return TimesheetResponse.fromEntity(ts);
    }

    @Transactional
    public TimesheetResponse submitTimesheet(UUID id) {
        Timesheet ts = getTimesheetOrThrow(id);

        if (ts.getStatus() != TimesheetStatus.DRAFT && ts.getStatus() != TimesheetStatus.REJECTED) {
            throw new IllegalStateException(
                    "Отправить можно только табель в статусе Черновик или Отклонено");
        }

        TimesheetStatus oldStatus = ts.getStatus();
        ts.setStatus(TimesheetStatus.SUBMITTED);
        ts = timesheetRepository.save(ts);
        auditService.logStatusChange("Timesheet", ts.getId(), oldStatus.name(), TimesheetStatus.SUBMITTED.name());

        log.info("Timesheet submitted: {}", ts.getId());
        return TimesheetResponse.fromEntity(ts);
    }

    @Transactional
    public TimesheetResponse approveTimesheet(UUID id, UUID approvedById) {
        Timesheet ts = getTimesheetOrThrow(id);

        if (ts.getStatus() != TimesheetStatus.SUBMITTED) {
            throw new IllegalStateException("Утвердить можно только отправленный табель");
        }

        TimesheetStatus oldStatus = ts.getStatus();
        ts.setStatus(TimesheetStatus.APPROVED);
        ts.setApprovedById(approvedById);
        ts = timesheetRepository.save(ts);
        auditService.logStatusChange("Timesheet", ts.getId(), oldStatus.name(), TimesheetStatus.APPROVED.name());

        log.info("Timesheet approved: {} by {}", ts.getId(), approvedById);
        return TimesheetResponse.fromEntity(ts);
    }

    @Transactional
    public TimesheetResponse rejectTimesheet(UUID id) {
        Timesheet ts = getTimesheetOrThrow(id);

        if (ts.getStatus() != TimesheetStatus.SUBMITTED) {
            throw new IllegalStateException("Отклонить можно только отправленный табель");
        }

        TimesheetStatus oldStatus = ts.getStatus();
        ts.setStatus(TimesheetStatus.REJECTED);
        ts = timesheetRepository.save(ts);
        auditService.logStatusChange("Timesheet", ts.getId(), oldStatus.name(), TimesheetStatus.REJECTED.name());

        log.info("Timesheet rejected: {}", ts.getId());
        return TimesheetResponse.fromEntity(ts);
    }

    @Transactional(readOnly = true)
    public TimesheetSummaryResponse getWeeklySummary(UUID employeeId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        List<Timesheet> entries = timesheetRepository
                .findByEmployeeIdAndWorkDateBetweenAndDeletedFalse(employeeId, weekStart, weekEnd);

        BigDecimal totalHours = entries.stream()
                .map(Timesheet::getHoursWorked)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalOvertime = entries.stream()
                .map(Timesheet::getOvertimeHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new TimesheetSummaryResponse(
                null, weekStart, weekEnd,
                totalHours, totalOvertime,
                entries.size(),
                entries.stream().map(TimesheetResponse::fromEntity).toList()
        );
    }

    @Transactional(readOnly = true)
    public TimesheetSummaryResponse getMonthlySummary(UUID projectId, YearMonth month) {
        LocalDate monthStart = month.atDay(1);
        LocalDate monthEnd = month.atEndOfMonth();
        List<Timesheet> entries = timesheetRepository
                .findByProjectIdAndWorkDateBetweenAndDeletedFalse(projectId, monthStart, monthEnd);

        BigDecimal totalHours = entries.stream()
                .map(Timesheet::getHoursWorked)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalOvertime = entries.stream()
                .map(Timesheet::getOvertimeHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new TimesheetSummaryResponse(
                projectId, monthStart, monthEnd,
                totalHours, totalOvertime,
                entries.size(),
                entries.stream().map(TimesheetResponse::fromEntity).toList()
        );
    }

    @Transactional
    public void deleteTimesheet(UUID id) {
        Timesheet ts = getTimesheetOrThrow(id);
        ts.softDelete();
        timesheetRepository.save(ts);
        auditService.logDelete("Timesheet", ts.getId());

        log.info("Timesheet deleted: {}", ts.getId());
    }

    @Transactional(readOnly = true)
    public BigDecimal getEmployeeHours(UUID employeeId, LocalDate startDate, LocalDate endDate) {
        return timesheetRepository.sumHoursByEmployeeAndDateRange(
                employeeId, startDate, endDate, TimesheetStatus.APPROVED);
    }

    private Timesheet getTimesheetOrThrow(UUID id) {
        return timesheetRepository.findById(id)
                .filter(ts -> !ts.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Табель не найден: " + id));
    }
}
