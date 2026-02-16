package com.privod.platform.modules.maintenance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.maintenance.domain.EquipmentStatus;
import com.privod.platform.modules.maintenance.domain.FrequencyType;
import com.privod.platform.modules.maintenance.domain.MaintenanceEquipment;
import com.privod.platform.modules.maintenance.domain.MaintenancePriority;
import com.privod.platform.modules.maintenance.domain.MaintenanceRequest;
import com.privod.platform.modules.maintenance.domain.MaintenanceStage;
import com.privod.platform.modules.maintenance.domain.MaintenanceTeam;
import com.privod.platform.modules.maintenance.domain.MaintenanceType;
import com.privod.platform.modules.maintenance.domain.PreventiveSchedule;
import com.privod.platform.modules.maintenance.domain.RequestStatus;
import com.privod.platform.modules.maintenance.repository.MaintenanceEquipmentRepository;
import com.privod.platform.modules.maintenance.repository.MaintenanceRequestRepository;
import com.privod.platform.modules.maintenance.repository.MaintenanceStageRepository;
import com.privod.platform.modules.maintenance.repository.MaintenanceTeamRepository;
import com.privod.platform.modules.maintenance.repository.PreventiveScheduleRepository;
import com.privod.platform.modules.maintenance.web.dto.CreateEquipmentRequest;
import com.privod.platform.modules.maintenance.web.dto.CreateMaintenanceRequest;
import com.privod.platform.modules.maintenance.web.dto.MaintenanceDashboardData;
import com.privod.platform.modules.maintenance.web.dto.MaintenanceEquipmentResponse;
import com.privod.platform.modules.maintenance.web.dto.MaintenanceRequestResponse;
import com.privod.platform.modules.maintenance.web.dto.PreventiveScheduleResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceService {

    private final MaintenanceRequestRepository requestRepository;
    private final MaintenanceStageRepository stageRepository;
    private final MaintenanceTeamRepository teamRepository;
    private final MaintenanceEquipmentRepository equipmentRepository;
    private final PreventiveScheduleRepository scheduleRepository;
    private final AuditService auditService;

    // ==================== REQUESTS ====================

    @Transactional(readOnly = true)
    public Page<MaintenanceRequestResponse> findAllRequests(String search, RequestStatus status,
                                                             UUID equipmentId, UUID teamId,
                                                             Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return requestRepository.searchByName(search.trim(), pageable)
                    .map(MaintenanceRequestResponse::fromEntity);
        }
        if (status != null) {
            return requestRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(MaintenanceRequestResponse::fromEntity);
        }
        if (equipmentId != null) {
            return requestRepository.findByEquipmentIdAndDeletedFalse(equipmentId, pageable)
                    .map(MaintenanceRequestResponse::fromEntity);
        }
        if (teamId != null) {
            return requestRepository.findByMaintenanceTeamIdAndDeletedFalse(teamId, pageable)
                    .map(MaintenanceRequestResponse::fromEntity);
        }
        return requestRepository.findAll(pageable).map(MaintenanceRequestResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public MaintenanceRequestResponse findRequestById(UUID id) {
        MaintenanceRequest request = getRequestOrThrow(id);
        return MaintenanceRequestResponse.fromEntity(request);
    }

    @Transactional
    public MaintenanceRequestResponse createRequest(CreateMaintenanceRequest dto) {
        MaintenanceRequest request = MaintenanceRequest.builder()
                .name(dto.name())
                .description(dto.description())
                .requestDate(dto.requestDate())
                .equipmentId(dto.equipmentId())
                .equipmentName(dto.equipmentName())
                .maintenanceTeamId(dto.maintenanceTeamId())
                .responsibleId(dto.responsibleId())
                .stageId(dto.stageId())
                .priority(dto.priority() != null ? dto.priority() : MaintenancePriority.NORMAL)
                .maintenanceType(dto.maintenanceType() != null ? dto.maintenanceType() : MaintenanceType.CORRECTIVE)
                .duration(dto.duration())
                .scheduledDate(dto.scheduledDate())
                .notes(dto.notes())
                .cost(dto.cost())
                .status(RequestStatus.NEW)
                .build();

        request = requestRepository.save(request);
        auditService.logCreate("MaintenanceRequest", request.getId());

        log.info("Maintenance request created: {} ({})", request.getName(), request.getId());
        return MaintenanceRequestResponse.fromEntity(request);
    }

    @Transactional
    public MaintenanceRequestResponse updateRequestStatus(UUID id, RequestStatus newStatus) {
        MaintenanceRequest request = getRequestOrThrow(id);
        RequestStatus oldStatus = request.getStatus();

        if (!request.canTransitionTo(newStatus)) {
            throw new IllegalStateException(
                    String.format("Cannot transition maintenance request from %s to %s", oldStatus, newStatus));
        }

        request.setStatus(newStatus);

        if (newStatus == RequestStatus.REPAIRED && request.getCompletedDate() == null) {
            request.setCompletedDate(LocalDate.now());
        }
        if (newStatus == RequestStatus.SCRAP && request.getCompletedDate() == null) {
            request.setCompletedDate(LocalDate.now());
        }

        request = requestRepository.save(request);
        auditService.logStatusChange("MaintenanceRequest", request.getId(), oldStatus.name(), newStatus.name());

        log.info("Maintenance request status changed: {} from {} to {} ({})",
                request.getName(), oldStatus, newStatus, request.getId());
        return MaintenanceRequestResponse.fromEntity(request);
    }

    @Transactional
    public MaintenanceRequestResponse updateRequestStage(UUID requestId, UUID stageId) {
        MaintenanceRequest request = getRequestOrThrow(requestId);
        MaintenanceStage stage = stageRepository.findById(stageId)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Maintenance stage not found: " + stageId));

        UUID oldStageId = request.getStageId();
        request.setStageId(stageId);

        if (stage.isClosed() && request.getStatus() != RequestStatus.REPAIRED
                && request.getStatus() != RequestStatus.SCRAP) {
            request.setStatus(RequestStatus.REPAIRED);
            request.setCompletedDate(LocalDate.now());
        }

        request = requestRepository.save(request);
        auditService.logUpdate("MaintenanceRequest", request.getId(), "stageId",
                oldStageId != null ? oldStageId.toString() : null, stageId.toString());

        log.info("Maintenance request stage changed: {} to stage {} ({})",
                request.getName(), stage.getName(), request.getId());
        return MaintenanceRequestResponse.fromEntity(request);
    }

    @Transactional
    public void deleteRequest(UUID id) {
        MaintenanceRequest request = getRequestOrThrow(id);
        request.softDelete();
        requestRepository.save(request);
        auditService.logDelete("MaintenanceRequest", id);
        log.info("Maintenance request soft-deleted: {} ({})", request.getName(), id);
    }

    // ==================== EQUIPMENT ====================

    @Transactional(readOnly = true)
    public Page<MaintenanceEquipmentResponse> findAllEquipment(String search, EquipmentStatus status,
                                                                Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return equipmentRepository.searchByNameOrSerial(search.trim(), pageable)
                    .map(MaintenanceEquipmentResponse::fromEntity);
        }
        if (status != null) {
            return equipmentRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(MaintenanceEquipmentResponse::fromEntity);
        }
        return equipmentRepository.findByDeletedFalse(pageable)
                .map(MaintenanceEquipmentResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public MaintenanceEquipmentResponse findEquipmentById(UUID id) {
        MaintenanceEquipment equipment = getEquipmentOrThrow(id);
        return MaintenanceEquipmentResponse.fromEntity(equipment);
    }

    @Transactional
    public MaintenanceEquipmentResponse createEquipment(CreateEquipmentRequest dto) {
        MaintenanceEquipment equipment = MaintenanceEquipment.builder()
                .name(dto.name())
                .serialNumber(dto.serialNumber())
                .model(dto.model())
                .category(dto.category())
                .assignedTo(dto.assignedTo())
                .location(dto.location())
                .purchaseDate(dto.purchaseDate())
                .warrantyDate(dto.warrantyDate())
                .cost(dto.cost())
                .status(dto.status() != null ? dto.status() : EquipmentStatus.OPERATIONAL)
                .notes(dto.notes())
                .maintenanceFrequencyDays(dto.maintenanceFrequencyDays() != null ? dto.maintenanceFrequencyDays() : 0)
                .build();

        if (equipment.getMaintenanceFrequencyDays() > 0) {
            equipment.setNextMaintenanceDate(LocalDate.now().plusDays(equipment.getMaintenanceFrequencyDays()));
        }

        equipment = equipmentRepository.save(equipment);
        auditService.logCreate("MaintenanceEquipment", equipment.getId());

        log.info("Maintenance equipment created: {} ({})", equipment.getName(), equipment.getId());
        return MaintenanceEquipmentResponse.fromEntity(equipment);
    }

    @Transactional
    public MaintenanceEquipmentResponse updateEquipment(UUID id, CreateEquipmentRequest dto) {
        MaintenanceEquipment equipment = getEquipmentOrThrow(id);

        if (dto.name() != null) {
            equipment.setName(dto.name());
        }
        if (dto.serialNumber() != null) {
            equipment.setSerialNumber(dto.serialNumber());
        }
        if (dto.model() != null) {
            equipment.setModel(dto.model());
        }
        if (dto.category() != null) {
            equipment.setCategory(dto.category());
        }
        if (dto.assignedTo() != null) {
            equipment.setAssignedTo(dto.assignedTo());
        }
        if (dto.location() != null) {
            equipment.setLocation(dto.location());
        }
        if (dto.purchaseDate() != null) {
            equipment.setPurchaseDate(dto.purchaseDate());
        }
        if (dto.warrantyDate() != null) {
            equipment.setWarrantyDate(dto.warrantyDate());
        }
        if (dto.cost() != null) {
            equipment.setCost(dto.cost());
        }
        if (dto.status() != null) {
            equipment.setStatus(dto.status());
        }
        if (dto.notes() != null) {
            equipment.setNotes(dto.notes());
        }
        if (dto.maintenanceFrequencyDays() != null) {
            equipment.setMaintenanceFrequencyDays(dto.maintenanceFrequencyDays());
        }

        equipment = equipmentRepository.save(equipment);
        auditService.logUpdate("MaintenanceEquipment", equipment.getId(), "multiple", null, null);

        log.info("Maintenance equipment updated: {} ({})", equipment.getName(), equipment.getId());
        return MaintenanceEquipmentResponse.fromEntity(equipment);
    }

    @Transactional
    public void deleteEquipment(UUID id) {
        MaintenanceEquipment equipment = getEquipmentOrThrow(id);
        equipment.softDelete();
        equipmentRepository.save(equipment);
        auditService.logDelete("MaintenanceEquipment", id);
        log.info("Maintenance equipment soft-deleted: {} ({})", equipment.getName(), id);
    }

    // ==================== TEAMS ====================

    @Transactional(readOnly = true)
    public Page<MaintenanceTeam> findAllTeams(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            return teamRepository.searchByName(search.trim(), pageable);
        }
        return teamRepository.findByDeletedFalse(pageable);
    }

    @Transactional(readOnly = true)
    public MaintenanceTeam findTeamById(UUID id) {
        return getTeamOrThrow(id);
    }

    @Transactional
    public MaintenanceTeam createTeam(MaintenanceTeam team) {
        team = teamRepository.save(team);
        auditService.logCreate("MaintenanceTeam", team.getId());
        log.info("Maintenance team created: {} ({})", team.getName(), team.getId());
        return team;
    }

    @Transactional
    public MaintenanceTeam updateTeam(UUID id, MaintenanceTeam updates) {
        MaintenanceTeam team = getTeamOrThrow(id);

        if (updates.getName() != null) {
            team.setName(updates.getName());
        }
        if (updates.getLeadId() != null) {
            team.setLeadId(updates.getLeadId());
        }
        if (updates.getColor() != null) {
            team.setColor(updates.getColor());
        }
        if (updates.getMemberIds() != null) {
            team.setMemberIds(updates.getMemberIds());
        }

        team = teamRepository.save(team);
        auditService.logUpdate("MaintenanceTeam", team.getId(), "multiple", null, null);
        log.info("Maintenance team updated: {} ({})", team.getName(), team.getId());
        return team;
    }

    @Transactional
    public void deleteTeam(UUID id) {
        MaintenanceTeam team = getTeamOrThrow(id);
        team.softDelete();
        teamRepository.save(team);
        auditService.logDelete("MaintenanceTeam", id);
        log.info("Maintenance team soft-deleted: {} ({})", team.getName(), id);
    }

    // ==================== STAGES ====================

    @Transactional(readOnly = true)
    public List<MaintenanceStage> findAllStages() {
        return stageRepository.findByDeletedFalseOrderBySequenceAsc();
    }

    // ==================== PREVENTIVE SCHEDULES ====================

    @Transactional(readOnly = true)
    public Page<PreventiveScheduleResponse> findAllSchedules(UUID equipmentId, Pageable pageable) {
        if (equipmentId != null) {
            return scheduleRepository.findByEquipmentIdAndDeletedFalse(equipmentId, pageable)
                    .map(PreventiveScheduleResponse::fromEntity);
        }
        return scheduleRepository.findByDeletedFalseAndIsActiveTrue(pageable)
                .map(PreventiveScheduleResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PreventiveScheduleResponse findScheduleById(UUID id) {
        PreventiveSchedule schedule = getScheduleOrThrow(id);
        return PreventiveScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public PreventiveScheduleResponse createSchedule(PreventiveSchedule schedule) {
        schedule = scheduleRepository.save(schedule);
        auditService.logCreate("PreventiveSchedule", schedule.getId());
        log.info("Preventive schedule created: {} ({})", schedule.getName(), schedule.getId());
        return PreventiveScheduleResponse.fromEntity(schedule);
    }

    @Transactional
    public void deleteSchedule(UUID id) {
        PreventiveSchedule schedule = getScheduleOrThrow(id);
        schedule.softDelete();
        scheduleRepository.save(schedule);
        auditService.logDelete("PreventiveSchedule", id);
        log.info("Preventive schedule soft-deleted: {} ({})", schedule.getName(), id);
    }

    /**
     * Processes preventive schedules that are due and creates maintenance requests automatically.
     * Should be called by a scheduler (e.g., daily cron job).
     */
    @Transactional
    public int processPreventiveSchedules() {
        LocalDate today = LocalDate.now();
        List<PreventiveSchedule> dueSchedules = scheduleRepository.findDueSchedules(today);
        int created = 0;

        for (PreventiveSchedule schedule : dueSchedules) {
            MaintenanceRequest request = MaintenanceRequest.builder()
                    .name("Preventive: " + schedule.getName())
                    .description(schedule.getDescription())
                    .requestDate(today)
                    .equipmentId(schedule.getEquipmentId())
                    .maintenanceTeamId(schedule.getMaintenanceTeamId())
                    .priority(MaintenancePriority.NORMAL)
                    .maintenanceType(MaintenanceType.PREVENTIVE)
                    .scheduledDate(schedule.getNextExecution())
                    .status(RequestStatus.NEW)
                    .build();

            requestRepository.save(request);

            schedule.setLastExecution(today);
            schedule.setNextExecution(calculateNextExecution(today, schedule.getFrequencyType(),
                    schedule.getFrequencyInterval()));
            scheduleRepository.save(schedule);

            created++;
            log.info("Auto-created preventive maintenance request for schedule: {} ({})",
                    schedule.getName(), schedule.getId());
        }

        return created;
    }

    // ==================== QUERIES ====================

    @Transactional(readOnly = true)
    public List<MaintenanceRequestResponse> findOverdueRequests() {
        return requestRepository.findOverdueRequests(LocalDate.now())
                .stream()
                .map(MaintenanceRequestResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PreventiveScheduleResponse> findUpcomingPreventive() {
        LocalDate today = LocalDate.now();
        LocalDate nextWeek = today.plusDays(7);
        return scheduleRepository.findUpcomingSchedules(today, nextWeek)
                .stream()
                .map(PreventiveScheduleResponse::fromEntity)
                .toList();
    }

    // ==================== DASHBOARD ====================

    @Transactional(readOnly = true)
    public MaintenanceDashboardData getDashboard() {
        long openRequests = requestRepository.countOpenRequests();

        Map<String, Long> requestsByStatus = new HashMap<>();
        List<Object[]> statusData = requestRepository.countByStatus();
        long totalRequests = 0;
        for (Object[] row : statusData) {
            RequestStatus status = (RequestStatus) row[0];
            Long count = (Long) row[1];
            requestsByStatus.put(status.name(), count);
            totalRequests += count;
        }

        Double avgResolutionDays = requestRepository.avgResolutionDays();

        long totalEquipment = equipmentRepository.countTotalEquipment();
        long operationalEquipment = equipmentRepository.countOperationalEquipment();

        BigDecimal utilizationPercent = BigDecimal.ZERO;
        if (totalEquipment > 0) {
            utilizationPercent = BigDecimal.valueOf(operationalEquipment)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalEquipment), 2, RoundingMode.HALF_UP);
        }

        Map<String, Long> equipmentByStatus = new HashMap<>();
        List<Object[]> equipStatusData = equipmentRepository.countByStatus();
        for (Object[] row : equipStatusData) {
            EquipmentStatus status = (EquipmentStatus) row[0];
            Long count = (Long) row[1];
            equipmentByStatus.put(status.name(), count);
        }

        List<MaintenanceRequestResponse> overdueRequests = findOverdueRequests();
        List<PreventiveScheduleResponse> upcomingPreventive = findUpcomingPreventive();

        return new MaintenanceDashboardData(
                openRequests,
                totalRequests,
                requestsByStatus,
                avgResolutionDays,
                totalEquipment,
                operationalEquipment,
                utilizationPercent,
                equipmentByStatus,
                overdueRequests,
                upcomingPreventive
        );
    }

    // ==================== HELPERS ====================

    private MaintenanceRequest getRequestOrThrow(UUID id) {
        return requestRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Maintenance request not found with id: " + id));
    }

    private MaintenanceEquipment getEquipmentOrThrow(UUID id) {
        return equipmentRepository.findById(id)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Maintenance equipment not found with id: " + id));
    }

    private MaintenanceTeam getTeamOrThrow(UUID id) {
        return teamRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Maintenance team not found with id: " + id));
    }

    private PreventiveSchedule getScheduleOrThrow(UUID id) {
        return scheduleRepository.findById(id)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Preventive schedule not found with id: " + id));
    }

    private LocalDate calculateNextExecution(LocalDate from, FrequencyType type, int interval) {
        return switch (type) {
            case DAYS -> from.plusDays(interval);
            case WEEKS -> from.plusWeeks(interval);
            case MONTHS -> from.plusMonths(interval);
            case YEARS -> from.plusYears(interval);
        };
    }
}
