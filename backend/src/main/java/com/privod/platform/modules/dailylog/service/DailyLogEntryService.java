package com.privod.platform.modules.dailylog.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.dailylog.domain.DailyLog;
import com.privod.platform.modules.dailylog.domain.DailyLogEntry;
import com.privod.platform.modules.dailylog.domain.DailyLogStatus;
import com.privod.platform.modules.dailylog.repository.DailyLogEntryRepository;
import com.privod.platform.modules.dailylog.repository.DailyLogRepository;
import com.privod.platform.modules.dailylog.web.dto.CreateDailyLogEntryRequest;
import com.privod.platform.modules.dailylog.web.dto.DailyLogEntryResponse;
import com.privod.platform.modules.dailylog.web.dto.UpdateDailyLogEntryRequest;
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
public class DailyLogEntryService {

    private final DailyLogEntryRepository entryRepository;
    private final DailyLogRepository dailyLogRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<DailyLogEntryResponse> listEntries(UUID dailyLogId, Pageable pageable) {
        getLogOrThrow(dailyLogId);
        return entryRepository.findByDailyLogIdAndDeletedFalse(dailyLogId, pageable)
                .map(DailyLogEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<DailyLogEntryResponse> listAllEntries(UUID dailyLogId) {
        getLogOrThrow(dailyLogId);
        return entryRepository.findByDailyLogIdAndDeletedFalse(dailyLogId)
                .stream()
                .map(DailyLogEntryResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public DailyLogEntryResponse getEntry(UUID dailyLogId, UUID entryId) {
        getLogOrThrow(dailyLogId);
        DailyLogEntry entry = getEntryOrThrow(dailyLogId, entryId);
        return DailyLogEntryResponse.fromEntity(entry);
    }

    @Transactional
    public DailyLogEntryResponse createEntry(UUID dailyLogId, CreateDailyLogEntryRequest request) {
        DailyLog dailyLog = getLogOrThrow(dailyLogId);

        if (dailyLog.getStatus() == DailyLogStatus.APPROVED) {
            throw new IllegalStateException("Невозможно добавить запись в утвержденный журнал КС-6");
        }

        DailyLogEntry entry = DailyLogEntry.builder()
                .dailyLogId(dailyLogId)
                .entryType(request.entryType())
                .description(request.description())
                .quantity(request.quantity())
                .unit(request.unit())
                .startTime(request.startTime())
                .endTime(request.endTime())
                .responsibleName(request.responsibleName())
                .taskId(request.taskId())
                .build();

        entry = entryRepository.save(entry);
        auditService.logCreate("DailyLogEntry", entry.getId());

        log.info("Daily log entry created: {} in log {} ({})",
                entry.getEntryType(), dailyLogId, entry.getId());
        return DailyLogEntryResponse.fromEntity(entry);
    }

    @Transactional
    public DailyLogEntryResponse updateEntry(UUID dailyLogId, UUID entryId, UpdateDailyLogEntryRequest request) {
        DailyLog dailyLog = getLogOrThrow(dailyLogId);

        if (dailyLog.getStatus() == DailyLogStatus.APPROVED) {
            throw new IllegalStateException("Невозможно редактировать запись в утвержденном журнале КС-6");
        }

        DailyLogEntry entry = getEntryOrThrow(dailyLogId, entryId);

        if (request.entryType() != null) {
            entry.setEntryType(request.entryType());
        }
        if (request.description() != null) {
            entry.setDescription(request.description());
        }
        if (request.quantity() != null) {
            entry.setQuantity(request.quantity());
        }
        if (request.unit() != null) {
            entry.setUnit(request.unit());
        }
        if (request.startTime() != null) {
            entry.setStartTime(request.startTime());
        }
        if (request.endTime() != null) {
            entry.setEndTime(request.endTime());
        }
        if (request.responsibleName() != null) {
            entry.setResponsibleName(request.responsibleName());
        }
        if (request.taskId() != null) {
            entry.setTaskId(request.taskId());
        }

        entry = entryRepository.save(entry);
        auditService.logUpdate("DailyLogEntry", entry.getId(), "multiple", null, null);

        log.info("Daily log entry updated: {} ({})", entryId, dailyLogId);
        return DailyLogEntryResponse.fromEntity(entry);
    }

    @Transactional
    public void deleteEntry(UUID dailyLogId, UUID entryId) {
        DailyLog dailyLog = getLogOrThrow(dailyLogId);

        if (dailyLog.getStatus() == DailyLogStatus.APPROVED) {
            throw new IllegalStateException("Невозможно удалить запись из утвержденного журнала КС-6");
        }

        DailyLogEntry entry = getEntryOrThrow(dailyLogId, entryId);
        entry.softDelete();
        entryRepository.save(entry);
        auditService.logDelete("DailyLogEntry", entry.getId());

        log.info("Daily log entry deleted: {} from log {} ({})", entryId, dailyLogId, entry.getId());
    }

    private DailyLog getLogOrThrow(UUID id) {
        return dailyLogRepository.findById(id)
                .filter(dl -> !dl.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Журнал КС-6 не найден: " + id));
    }

    private DailyLogEntry getEntryOrThrow(UUID dailyLogId, UUID entryId) {
        return entryRepository.findById(entryId)
                .filter(e -> !e.isDeleted() && e.getDailyLogId().equals(dailyLogId))
                .orElseThrow(() -> new EntityNotFoundException("Запись журнала не найдена: " + entryId));
    }
}
