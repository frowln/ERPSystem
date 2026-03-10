package com.privod.platform.modules.mobile.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.mobile.domain.FieldReport;
import com.privod.platform.modules.mobile.domain.FieldReportStatus;
import com.privod.platform.modules.mobile.domain.OfflineActionStatus;
import com.privod.platform.modules.mobile.domain.PhotoCapture;
import com.privod.platform.modules.mobile.repository.FieldReportRepository;
import com.privod.platform.modules.mobile.repository.OfflineActionRepository;
import com.privod.platform.modules.mobile.repository.PhotoCaptureRepository;
import com.privod.platform.modules.mobile.web.dto.CreateFieldReportRequest;
import com.privod.platform.modules.mobile.web.dto.FieldReportPhotoResponse;
import com.privod.platform.modules.mobile.web.dto.FieldReportResponse;
import com.privod.platform.modules.mobile.web.dto.MobileTaskResponse;
import com.privod.platform.modules.mobile.web.dto.SyncStatusResponse;
import com.privod.platform.modules.mobile.web.dto.UpdateFieldReportRequest;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.task.domain.ProjectTask;
import com.privod.platform.modules.task.domain.TaskStatus;
import com.privod.platform.modules.task.repository.ProjectTaskRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MobileForemanService {

    private final FieldReportRepository fieldReportRepository;
    private final PhotoCaptureRepository photoCaptureRepository;
    private final OfflineActionRepository offlineActionRepository;
    private final ProjectRepository projectRepository;
    private final ProjectTaskRepository projectTaskRepository;
    private final AuditService auditService;

    // ========================================================================
    // Field Reports
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<FieldReportResponse> listFieldReports(String status, UUID projectId,
                                                       String search, LocalDate dateFrom,
                                                       LocalDate dateTo, Pageable pageable) {
        Specification<FieldReport> spec = buildFieldReportSpec(status, projectId, search, dateFrom, dateTo);
        Page<FieldReport> page = fieldReportRepository.findAll(spec, pageable);

        // Batch-load project names
        List<UUID> projectIds = page.getContent().stream()
                .map(FieldReport::getProjectId)
                .distinct()
                .toList();
        Map<UUID, String> projectNames = loadProjectNames(projectIds);

        return page.map(fr -> {
            List<FieldReportPhotoResponse> photos = loadPhotosForReport(fr.getId());
            return FieldReportResponse.fromEntity(fr, projectNames.get(fr.getProjectId()), photos);
        });
    }

    @Transactional(readOnly = true)
    public FieldReportResponse getFieldReport(UUID id) {
        FieldReport fr = getFieldReportOrThrow(id);
        String projectName = loadProjectName(fr.getProjectId());
        List<FieldReportPhotoResponse> photos = loadPhotosForReport(fr.getId());
        return FieldReportResponse.fromEntity(fr, projectName, photos);
    }

    @Transactional
    public FieldReportResponse createFieldReport(CreateFieldReportRequest request) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        String currentUserName = SecurityUtils.getCurrentUserDetails()
                .map(d -> d.getFirstName() + " " + d.getLastName())
                .orElse("Unknown");

        String number = generateFieldReportNumber();

        FieldReport fr = FieldReport.builder()
                .number(number)
                .title(request.title())
                .description(request.description())
                .status(FieldReportStatus.DRAFT)
                .projectId(request.projectId())
                .authorId(currentUserId)
                .authorName(currentUserName)
                .location(request.location())
                .weatherCondition(request.weatherCondition())
                .temperature(request.temperature())
                .workersOnSite(request.workersOnSite())
                .reportDate(request.reportDate())
                .build();

        fr = fieldReportRepository.save(fr);
        auditService.logCreate("FieldReport", fr.getId());

        log.info("Полевой отчёт создан: {} ({}) автором {}", fr.getNumber(), fr.getId(), currentUserId);
        String projectName = loadProjectName(fr.getProjectId());
        return FieldReportResponse.fromEntity(fr, projectName, List.of());
    }

    @Transactional
    public FieldReportResponse updateFieldReport(UUID id, UpdateFieldReportRequest request) {
        FieldReport fr = getFieldReportOrThrow(id);

        if (fr.getStatus() != FieldReportStatus.DRAFT) {
            throw new IllegalStateException("Можно редактировать только отчёты в статусе 'Черновик'");
        }

        if (request.title() != null) fr.setTitle(request.title());
        if (request.description() != null) fr.setDescription(request.description());
        if (request.location() != null) fr.setLocation(request.location());
        if (request.weatherCondition() != null) fr.setWeatherCondition(request.weatherCondition());
        if (request.temperature() != null) fr.setTemperature(request.temperature());
        if (request.workersOnSite() != null) fr.setWorkersOnSite(request.workersOnSite());
        if (request.reportDate() != null) fr.setReportDate(request.reportDate());

        fr = fieldReportRepository.save(fr);
        auditService.logUpdate("FieldReport", fr.getId(), "multiple", null, null);

        log.info("Полевой отчёт обновлён: {} ({})", fr.getNumber(), fr.getId());
        String projectName = loadProjectName(fr.getProjectId());
        List<FieldReportPhotoResponse> photos = loadPhotosForReport(fr.getId());
        return FieldReportResponse.fromEntity(fr, projectName, photos);
    }

    @Transactional
    public FieldReportResponse submitFieldReport(UUID id) {
        FieldReport fr = getFieldReportOrThrow(id);
        FieldReportStatus oldStatus = fr.getStatus();

        if (!fr.canTransitionTo(FieldReportStatus.SUBMITTED)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести отчёт из статуса '%s' в 'Отправлен'",
                            oldStatus.getDisplayName()));
        }

        fr.setStatus(FieldReportStatus.SUBMITTED);
        fr = fieldReportRepository.save(fr);
        auditService.logStatusChange("FieldReport", fr.getId(), oldStatus.name(), "SUBMITTED");

        log.info("Полевой отчёт отправлен: {} ({}), {} -> SUBMITTED", fr.getNumber(), fr.getId(), oldStatus);
        String projectName = loadProjectName(fr.getProjectId());
        List<FieldReportPhotoResponse> photos = loadPhotosForReport(fr.getId());
        return FieldReportResponse.fromEntity(fr, projectName, photos);
    }

    // ========================================================================
    // Photos (linked to field reports)
    // ========================================================================

    @Transactional
    public FieldReportPhotoResponse uploadPhotoForReport(UUID reportId, String photoUrl, String caption) {
        FieldReport fr = getFieldReportOrThrow(reportId);
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        String currentUserName = SecurityUtils.getCurrentUserDetails()
                .map(d -> d.getFirstName() + " " + d.getLastName())
                .orElse("Unknown");

        PhotoCapture photo = PhotoCapture.builder()
                .userId(currentUserId)
                .projectId(fr.getProjectId())
                .photoUrl(photoUrl)
                .takenAt(Instant.now())
                .entityType("FieldReport")
                .entityId(reportId)
                .description(caption)
                .build();

        photo = photoCaptureRepository.save(photo);
        auditService.logCreate("PhotoCapture", photo.getId());

        log.info("Фото загружено для отчёта {}: {}", reportId, photo.getId());
        return FieldReportPhotoResponse.fromEntity(photo, currentUserName);
    }

    @Transactional(readOnly = true)
    public List<FieldReportPhotoResponse> getPhotosForReport(UUID reportId) {
        getFieldReportOrThrow(reportId); // verify report exists
        return loadPhotosForReport(reportId);
    }

    // ========================================================================
    // Sync Status
    // ========================================================================

    @Transactional(readOnly = true)
    public SyncStatusResponse getSyncStatus() {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();

        long pendingReports = fieldReportRepository.countByAuthorIdAndStatusAndDeletedFalse(
                currentUserId, FieldReportStatus.DRAFT);

        long pendingActions = offlineActionRepository.countByUserIdAndStatusAndDeletedFalse(
                currentUserId, OfflineActionStatus.PENDING);

        return new SyncStatusResponse(
                pendingReports,
                0, // photo sync is immediate on server side
                Instant.now(),
                true, // server is online if this endpoint responds
                false,
                pendingActions
        );
    }

    @Transactional
    public void triggerSync() {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();
        log.info("Синхронизация запрошена пользователем: {}", currentUserId);
        // In a full implementation this would process pending offline actions.
        // For now, the endpoint returns successfully (sync is real-time via API).
    }

    // ========================================================================
    // Mobile Tasks
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<MobileTaskResponse> getMobileTasks(Pageable pageable) {
        UUID currentUserId = SecurityUtils.requireCurrentUserId();

        Specification<ProjectTask> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));
            predicates.add(cb.equal(root.get("assigneeId"), currentUserId));
            predicates.add(root.get("status").in(
                    TaskStatus.BACKLOG, TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<ProjectTask> page = projectTaskRepository.findAll(spec, pageable);

        // Batch-load project names
        List<UUID> projectIds = page.getContent().stream()
                .map(ProjectTask::getProjectId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();
        Map<UUID, String> projectNames = loadProjectNames(projectIds);

        return page.map(task -> MobileTaskResponse.fromEntity(task, projectNames.get(task.getProjectId())));
    }

    @Transactional
    public MobileTaskResponse completeTask(UUID taskId) {
        ProjectTask task = projectTaskRepository.findById(taskId)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Задача не найдена: " + taskId));

        if (!task.canTransitionTo(TaskStatus.DONE)) {
            throw new IllegalStateException(
                    String.format("Невозможно завершить задачу в статусе '%s'",
                            task.getStatus().getDisplayName()));
        }

        TaskStatus oldStatus = task.getStatus();
        task.setStatus(TaskStatus.DONE);
        task.setActualEndDate(LocalDate.now());
        task.setProgress(100);

        task = projectTaskRepository.save(task);
        auditService.logStatusChange("ProjectTask", task.getId(), oldStatus.name(), "DONE");

        log.info("Задача завершена через мобильное: {} ({})", task.getCode(), task.getId());
        String projectName = task.getProjectId() != null ? loadProjectName(task.getProjectId()) : null;
        return MobileTaskResponse.fromEntity(task, projectName);
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private FieldReport getFieldReportOrThrow(UUID id) {
        return fieldReportRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Полевой отчёт не найден: " + id));
    }

    private String generateFieldReportNumber() {
        long seq = fieldReportRepository.getNextNumberSequence();
        return String.format("ПО-%05d", seq);
    }

    private Specification<FieldReport> buildFieldReportSpec(String status, UUID projectId,
                                                              String search, LocalDate dateFrom,
                                                              LocalDate dateTo) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("deleted"), false));

            if (status != null && !status.isBlank()) {
                try {
                    FieldReportStatus frStatus = FieldReportStatus.valueOf(status);
                    predicates.add(cb.equal(root.get("status"), frStatus));
                } catch (IllegalArgumentException ignored) {
                    // ignore invalid status filter
                }
            }

            if (projectId != null) {
                predicates.add(cb.equal(root.get("projectId"), projectId));
            }

            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), pattern),
                        cb.like(cb.lower(root.get("number")), pattern),
                        cb.like(cb.lower(root.get("description")), pattern)
                ));
            }

            if (dateFrom != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("reportDate"), dateFrom));
            }

            if (dateTo != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("reportDate"), dateTo));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private List<FieldReportPhotoResponse> loadPhotosForReport(UUID reportId) {
        return photoCaptureRepository
                .findByEntityTypeAndEntityIdAndDeletedFalse("FieldReport", reportId, Pageable.unpaged())
                .getContent()
                .stream()
                .map(FieldReportPhotoResponse::fromEntity)
                .toList();
    }

    private String loadProjectName(UUID projectId) {
        if (projectId == null) return null;
        return projectRepository.findById(projectId)
                .map(Project::getName)
                .orElse(null);
    }

    private Map<UUID, String> loadProjectNames(List<UUID> projectIds) {
        if (projectIds == null || projectIds.isEmpty()) {
            return Map.of();
        }
        return projectRepository.findAllById(projectIds).stream()
                .collect(Collectors.toMap(Project::getId, Project::getName, (a, b) -> a));
    }
}
