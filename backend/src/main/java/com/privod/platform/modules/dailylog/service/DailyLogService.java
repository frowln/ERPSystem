package com.privod.platform.modules.dailylog.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.dailylog.domain.DailyLog;
import com.privod.platform.modules.dailylog.domain.DailyLogPhoto;
import com.privod.platform.modules.dailylog.domain.DailyLogStatus;
import com.privod.platform.modules.dailylog.repository.DailyLogPhotoRepository;
import com.privod.platform.modules.dailylog.repository.DailyLogRepository;
import com.privod.platform.modules.dailylog.web.dto.CreateDailyLogPhotoRequest;
import com.privod.platform.modules.dailylog.web.dto.CreateDailyLogRequest;
import com.privod.platform.modules.dailylog.web.dto.DailyLogPhotoResponse;
import com.privod.platform.modules.dailylog.web.dto.DailyLogResponse;
import com.privod.platform.modules.dailylog.web.dto.UpdateDailyLogRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyLogService {

    private final DailyLogRepository dailyLogRepository;
    private final DailyLogPhotoRepository photoRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<DailyLogResponse> listLogs(UUID projectId, Pageable pageable) {
        if (projectId != null) {
            return dailyLogRepository.findByProjectIdAndDeletedFalse(projectId, pageable)
                    .map(DailyLogResponse::fromEntity);
        }
        return dailyLogRepository.findByDeletedFalse(pageable)
                .map(DailyLogResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public DailyLogResponse getLog(UUID id) {
        DailyLog dailyLog = getLogOrThrow(id);
        return DailyLogResponse.fromEntity(dailyLog);
    }

    @Transactional(readOnly = true)
    public DailyLogResponse getLogByProjectAndDate(UUID projectId, LocalDate date) {
        DailyLog dailyLog = dailyLogRepository.findByProjectIdAndLogDateAndDeletedFalse(projectId, date)
                .orElseThrow(() -> new EntityNotFoundException(
                        String.format("Журнал КС-6 не найден для проекта %s на дату %s", projectId, date)));
        return DailyLogResponse.fromEntity(dailyLog);
    }

    @Transactional
    public DailyLogResponse createLog(CreateDailyLogRequest request) {
        dailyLogRepository.findByProjectIdAndLogDateAndDeletedFalse(request.projectId(), request.logDate())
                .ifPresent(existing -> {
                    throw new IllegalStateException(
                            String.format("Журнал КС-6 уже существует для проекта на дату %s (код: %s)",
                                    request.logDate(), existing.getCode()));
                });

        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String code = generateCode();

        DailyLog dailyLog = DailyLog.builder()
                .organizationId(organizationId)
                .code(code)
                .projectId(request.projectId())
                .logDate(request.logDate())
                .weatherConditions(request.weatherConditions())
                .temperatureMin(request.temperatureMin())
                .temperatureMax(request.temperatureMax())
                .windSpeed(request.windSpeed())
                .shiftSupervisorId(request.shiftSupervisorId())
                .shiftSupervisorName(request.shiftSupervisorName())
                .status(DailyLogStatus.DRAFT)
                .generalNotes(request.generalNotes())
                .build();

        dailyLog = dailyLogRepository.save(dailyLog);
        auditService.logCreate("DailyLog", dailyLog.getId());

        log.info("Daily log created: {} for project {} on {} ({})",
                dailyLog.getCode(), dailyLog.getProjectId(), dailyLog.getLogDate(), dailyLog.getId());
        return DailyLogResponse.fromEntity(dailyLog);
    }

    @Transactional
    public DailyLogResponse updateLog(UUID id, UpdateDailyLogRequest request) {
        DailyLog dailyLog = getLogOrThrow(id);

        if (dailyLog.getStatus() == DailyLogStatus.APPROVED) {
            throw new IllegalStateException("Невозможно редактировать утвержденный журнал КС-6");
        }

        if (request.weatherConditions() != null) {
            dailyLog.setWeatherConditions(request.weatherConditions());
        }
        if (request.temperatureMin() != null) {
            dailyLog.setTemperatureMin(request.temperatureMin());
        }
        if (request.temperatureMax() != null) {
            dailyLog.setTemperatureMax(request.temperatureMax());
        }
        if (request.windSpeed() != null) {
            dailyLog.setWindSpeed(request.windSpeed());
        }
        if (request.shiftSupervisorId() != null) {
            dailyLog.setShiftSupervisorId(request.shiftSupervisorId());
        }
        if (request.shiftSupervisorName() != null) {
            dailyLog.setShiftSupervisorName(request.shiftSupervisorName());
        }
        if (request.generalNotes() != null) {
            dailyLog.setGeneralNotes(request.generalNotes());
        }

        dailyLog = dailyLogRepository.save(dailyLog);
        auditService.logUpdate("DailyLog", dailyLog.getId(), "multiple", null, null);

        log.info("Daily log updated: {} ({})", dailyLog.getCode(), dailyLog.getId());
        return DailyLogResponse.fromEntity(dailyLog);
    }

    @Transactional
    public DailyLogResponse submitLog(UUID id) {
        DailyLog dailyLog = getLogOrThrow(id);

        if (dailyLog.getStatus() != DailyLogStatus.DRAFT) {
            throw new IllegalStateException(
                    String.format("Невозможно отправить журнал из статуса '%s'",
                            dailyLog.getStatus().getDisplayName()));
        }

        DailyLogStatus oldStatus = dailyLog.getStatus();
        dailyLog.setStatus(DailyLogStatus.SUBMITTED);

        dailyLog = dailyLogRepository.save(dailyLog);
        auditService.logStatusChange("DailyLog", dailyLog.getId(),
                oldStatus.name(), DailyLogStatus.SUBMITTED.name());

        log.info("Daily log submitted: {} ({})", dailyLog.getCode(), dailyLog.getId());
        return DailyLogResponse.fromEntity(dailyLog);
    }

    @Transactional
    public DailyLogResponse approveLog(UUID id) {
        DailyLog dailyLog = getLogOrThrow(id);

        if (dailyLog.getStatus() != DailyLogStatus.SUBMITTED) {
            throw new IllegalStateException(
                    String.format("Невозможно утвердить журнал из статуса '%s'",
                            dailyLog.getStatus().getDisplayName()));
        }

        DailyLogStatus oldStatus = dailyLog.getStatus();
        dailyLog.setStatus(DailyLogStatus.APPROVED);

        dailyLog = dailyLogRepository.save(dailyLog);
        auditService.logStatusChange("DailyLog", dailyLog.getId(),
                oldStatus.name(), DailyLogStatus.APPROVED.name());

        log.info("Daily log approved: {} ({})", dailyLog.getCode(), dailyLog.getId());
        return DailyLogResponse.fromEntity(dailyLog);
    }

    @Transactional(readOnly = true)
    public List<DailyLogResponse> getByDateRange(UUID projectId, LocalDate startDate, LocalDate endDate) {
        return dailyLogRepository.findByProjectIdAndDateRange(projectId, startDate, endDate)
                .stream()
                .map(DailyLogResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<DailyLogResponse> getProjectTimeline(UUID projectId) {
        return dailyLogRepository.findProjectTimeline(projectId)
                .stream()
                .map(DailyLogResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void deleteLog(UUID id) {
        DailyLog dailyLog = getLogOrThrow(id);

        if (dailyLog.getStatus() == DailyLogStatus.APPROVED) {
            throw new IllegalStateException("Невозможно удалить утвержденный журнал КС-6");
        }

        dailyLog.softDelete();
        dailyLogRepository.save(dailyLog);
        auditService.logDelete("DailyLog", dailyLog.getId());

        log.info("Daily log deleted: {} ({})", dailyLog.getCode(), dailyLog.getId());
    }

    // ---- Photo management ----

    @Transactional(readOnly = true)
    public Page<DailyLogPhotoResponse> listPhotos(UUID dailyLogId, Pageable pageable) {
        getLogOrThrow(dailyLogId);
        return photoRepository.findByDailyLogIdAndDeletedFalse(dailyLogId, pageable)
                .map(DailyLogPhotoResponse::fromEntity);
    }

    @Transactional
    public DailyLogPhotoResponse addPhoto(UUID dailyLogId, CreateDailyLogPhotoRequest request) {
        getLogOrThrow(dailyLogId);

        DailyLogPhoto photo = DailyLogPhoto.builder()
                .dailyLogId(dailyLogId)
                .photoUrl(request.photoUrl())
                .thumbnailUrl(request.thumbnailUrl())
                .caption(request.caption())
                .takenAt(request.takenAt())
                .takenById(request.takenById())
                .gpsLatitude(request.gpsLatitude())
                .gpsLongitude(request.gpsLongitude())
                .build();

        photo = photoRepository.save(photo);
        log.info("Photo added to daily log {} ({})", dailyLogId, photo.getId());
        return DailyLogPhotoResponse.fromEntity(photo);
    }

    @Transactional
    public void deletePhoto(UUID dailyLogId, UUID photoId) {
        getLogOrThrow(dailyLogId);
        DailyLogPhoto photo = photoRepository.findById(photoId)
                .filter(p -> !p.isDeleted() && p.getDailyLogId().equals(dailyLogId))
                .orElseThrow(() -> new EntityNotFoundException("Фотография не найдена: " + photoId));

        photo.softDelete();
        photoRepository.save(photo);
        log.info("Photo deleted from daily log {} ({})", dailyLogId, photoId);
    }

    private DailyLog getLogOrThrow(UUID id) {
        return dailyLogRepository.findById(id)
                .filter(dl -> !dl.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Журнал КС-6 не найден: " + id));
    }

    private String generateCode() {
        long seq = dailyLogRepository.getNextNumberSequence();
        return String.format("KS6-%05d", seq);
    }
}
