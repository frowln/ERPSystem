package com.privod.platform.modules.hr.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hr.domain.CrewTimeEntry;
import com.privod.platform.modules.hr.domain.CrewTimeSheet;
import com.privod.platform.modules.hr.domain.CrewTimeSheetStatus;
import com.privod.platform.modules.hr.repository.CrewTimeEntryRepository;
import com.privod.platform.modules.hr.repository.CrewTimeSheetRepository;
import com.privod.platform.modules.hr.web.dto.CreateCrewTimeEntryRequest;
import com.privod.platform.modules.hr.web.dto.CreateCrewTimeSheetRequest;
import com.privod.platform.modules.hr.web.dto.CrewTimeEntryResponse;
import com.privod.platform.modules.hr.web.dto.CrewTimeSheetResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CrewTimeService {

    private final CrewTimeEntryRepository entryRepository;
    private final CrewTimeSheetRepository sheetRepository;
    private final AuditService auditService;

    // ========================================================================
    // Crew Time Entries
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<CrewTimeEntryResponse> listEntries(UUID crewId, UUID employeeId, Pageable pageable) {
        if (crewId != null) {
            return entryRepository.findByCrewIdAndDeletedFalse(crewId, pageable)
                    .map(CrewTimeEntryResponse::fromEntity);
        }
        if (employeeId != null) {
            return entryRepository.findByEmployeeIdAndDeletedFalse(employeeId, pageable)
                    .map(CrewTimeEntryResponse::fromEntity);
        }
        return entryRepository.findAll(pageable)
                .map(CrewTimeEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CrewTimeEntryResponse getEntry(UUID id) {
        CrewTimeEntry entry = getEntryOrThrow(id);
        return CrewTimeEntryResponse.fromEntity(entry);
    }

    @Transactional
    public CrewTimeEntryResponse createEntry(CreateCrewTimeEntryRequest request) {
        CrewTimeEntry entry = CrewTimeEntry.builder()
                .crewId(request.crewId())
                .employeeId(request.employeeId())
                .projectId(request.projectId())
                .workDate(request.workDate())
                .hoursWorked(request.hoursWorked())
                .overtimeHours(request.overtimeHours() != null ? request.overtimeHours() : BigDecimal.ZERO)
                .activityType(request.activityType())
                .notes(request.notes())
                .build();

        entry = entryRepository.save(entry);
        auditService.logCreate("CrewTimeEntry", entry.getId());

        log.info("Запись времени бригады создана: бригада={}, сотрудник={}, дата={} ({})",
                request.crewId(), request.employeeId(), request.workDate(), entry.getId());
        return CrewTimeEntryResponse.fromEntity(entry);
    }

    @Transactional
    public void deleteEntry(UUID id) {
        CrewTimeEntry entry = getEntryOrThrow(id);
        entry.softDelete();
        entryRepository.save(entry);
        auditService.logDelete("CrewTimeEntry", id);
        log.info("Запись времени бригады удалена: {}", id);
    }

    // ========================================================================
    // Crew Time Sheets
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<CrewTimeSheetResponse> listSheets(UUID crewId, UUID projectId, Pageable pageable) {
        if (crewId != null) {
            return sheetRepository.findByCrewIdAndDeletedFalse(crewId, pageable)
                    .map(CrewTimeSheetResponse::fromEntity);
        }
        if (projectId != null) {
            return sheetRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(CrewTimeSheetResponse::fromEntity);
        }
        return sheetRepository.findByDeletedFalse(pageable)
                .map(CrewTimeSheetResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CrewTimeSheetResponse getSheet(UUID id) {
        CrewTimeSheet sheet = getSheetOrThrow(id);
        return CrewTimeSheetResponse.fromEntity(sheet);
    }

    @Transactional
    public CrewTimeSheetResponse createSheet(CreateCrewTimeSheetRequest request) {
        CrewTimeSheet sheet = CrewTimeSheet.builder()
                .crewId(request.crewId())
                .projectId(request.projectId())
                .periodStart(request.periodStart())
                .periodEnd(request.periodEnd())
                .status(CrewTimeSheetStatus.DRAFT)
                .build();

        sheet = sheetRepository.save(sheet);
        auditService.logCreate("CrewTimeSheet", sheet.getId());

        log.info("Табель бригады создан: бригада={}, проект={}, период={}-{} ({})",
                request.crewId(), request.projectId(), request.periodStart(), request.periodEnd(), sheet.getId());
        return CrewTimeSheetResponse.fromEntity(sheet);
    }

    @Transactional
    public CrewTimeSheetResponse recalculateSheet(UUID id) {
        CrewTimeSheet sheet = getSheetOrThrow(id);

        List<CrewTimeEntry> entries = entryRepository.findByCrewIdAndProjectIdAndWorkDateBetweenAndDeletedFalse(
                sheet.getCrewId(), sheet.getProjectId(), sheet.getPeriodStart(), sheet.getPeriodEnd());

        BigDecimal totalHours = entries.stream()
                .map(CrewTimeEntry::getHoursWorked)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalOvertime = entries.stream()
                .map(CrewTimeEntry::getOvertimeHours)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        sheet.setTotalHours(totalHours);
        sheet.setTotalOvertime(totalOvertime);
        sheet = sheetRepository.save(sheet);

        log.info("Табель бригады пересчитан: {} часов={}, переработка={}", sheet.getId(), totalHours, totalOvertime);
        return CrewTimeSheetResponse.fromEntity(sheet);
    }

    @Transactional
    public CrewTimeSheetResponse submitSheet(UUID id) {
        CrewTimeSheet sheet = getSheetOrThrow(id);

        if (sheet.getStatus() != CrewTimeSheetStatus.DRAFT && sheet.getStatus() != CrewTimeSheetStatus.REJECTED) {
            throw new IllegalStateException("Отправить можно только табель в статусе Черновик или Отклонено");
        }

        CrewTimeSheetStatus oldStatus = sheet.getStatus();
        sheet.setStatus(CrewTimeSheetStatus.SUBMITTED);
        sheet = sheetRepository.save(sheet);
        auditService.logStatusChange("CrewTimeSheet", sheet.getId(), oldStatus.name(), CrewTimeSheetStatus.SUBMITTED.name());

        log.info("Табель бригады отправлен: {}", sheet.getId());
        return CrewTimeSheetResponse.fromEntity(sheet);
    }

    @Transactional
    public CrewTimeSheetResponse approveSheet(UUID id, UUID approvedById) {
        CrewTimeSheet sheet = getSheetOrThrow(id);

        if (sheet.getStatus() != CrewTimeSheetStatus.SUBMITTED) {
            throw new IllegalStateException("Утвердить можно только отправленный табель");
        }

        CrewTimeSheetStatus oldStatus = sheet.getStatus();
        sheet.setStatus(CrewTimeSheetStatus.APPROVED);
        sheet.setApprovedById(approvedById);
        sheet.setApprovedAt(LocalDateTime.now());
        sheet = sheetRepository.save(sheet);
        auditService.logStatusChange("CrewTimeSheet", sheet.getId(), oldStatus.name(), CrewTimeSheetStatus.APPROVED.name());

        log.info("Табель бригады утверждён: {} утвердил {}", sheet.getId(), approvedById);
        return CrewTimeSheetResponse.fromEntity(sheet);
    }

    @Transactional
    public CrewTimeSheetResponse rejectSheet(UUID id) {
        CrewTimeSheet sheet = getSheetOrThrow(id);

        if (sheet.getStatus() != CrewTimeSheetStatus.SUBMITTED) {
            throw new IllegalStateException("Отклонить можно только отправленный табель");
        }

        CrewTimeSheetStatus oldStatus = sheet.getStatus();
        sheet.setStatus(CrewTimeSheetStatus.REJECTED);
        sheet = sheetRepository.save(sheet);
        auditService.logStatusChange("CrewTimeSheet", sheet.getId(), oldStatus.name(), CrewTimeSheetStatus.REJECTED.name());

        log.info("Табель бригады отклонён: {}", sheet.getId());
        return CrewTimeSheetResponse.fromEntity(sheet);
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private CrewTimeEntry getEntryOrThrow(UUID id) {
        return entryRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Запись времени не найдена: " + id));
    }

    private CrewTimeSheet getSheetOrThrow(UUID id) {
        return sheetRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Табель бригады не найден: " + id));
    }
}
