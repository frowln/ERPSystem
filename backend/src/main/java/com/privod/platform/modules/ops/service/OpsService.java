package com.privod.platform.modules.ops.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.ops.domain.DailyReport;
import com.privod.platform.modules.ops.domain.Defect;
import com.privod.platform.modules.ops.domain.DefectSeverity;
import com.privod.platform.modules.ops.domain.DefectStatus;
import com.privod.platform.modules.ops.domain.FieldInstruction;
import com.privod.platform.modules.ops.domain.FieldInstructionStatus;
import com.privod.platform.modules.ops.domain.ShiftHandover;
import com.privod.platform.modules.ops.domain.WeatherRecord;
import com.privod.platform.modules.ops.domain.WorkOrder;
import com.privod.platform.modules.ops.domain.WorkOrderPriority;
import com.privod.platform.modules.ops.domain.WorkOrderStatus;
import com.privod.platform.modules.ops.repository.DailyReportRepository;
import com.privod.platform.modules.ops.repository.DefectRepository;
import com.privod.platform.modules.ops.repository.FieldInstructionRepository;
import com.privod.platform.modules.ops.repository.ShiftHandoverRepository;
import com.privod.platform.modules.ops.repository.WeatherRecordRepository;
import com.privod.platform.modules.ops.repository.WorkOrderRepository;
import com.privod.platform.modules.ops.web.dto.CreateDailyReportRequest;
import com.privod.platform.modules.ops.web.dto.CreateDefectRequest;
import com.privod.platform.modules.ops.web.dto.CreateWorkOrderRequest;
import com.privod.platform.modules.ops.web.dto.DailyReportResponse;
import com.privod.platform.modules.ops.web.dto.DefectResponse;
import com.privod.platform.modules.ops.web.dto.UpdateWorkOrderRequest;
import com.privod.platform.modules.ops.web.dto.WorkOrderResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OpsService {

    private final WorkOrderRepository workOrderRepository;
    private final DailyReportRepository dailyReportRepository;
    private final DefectRepository defectRepository;
    private final FieldInstructionRepository fieldInstructionRepository;
    private final WeatherRecordRepository weatherRecordRepository;
    private final ShiftHandoverRepository shiftHandoverRepository;
    private final AuditService auditService;

    // ========================================================================
    // Work Orders
    // ========================================================================

    @Transactional(readOnly = true)
    public Page<WorkOrderResponse> listWorkOrders(UUID projectId, WorkOrderStatus status,
                                                   WorkOrderPriority priority, UUID foremanId,
                                                   Pageable pageable) {
        Specification<WorkOrder> spec = Specification
                .where(WorkOrderSpecification.notDeleted())
                .and(WorkOrderSpecification.hasProject(projectId))
                .and(WorkOrderSpecification.hasStatus(status))
                .and(WorkOrderSpecification.hasPriority(priority))
                .and(WorkOrderSpecification.hasForeman(foremanId));

        return workOrderRepository.findAll(spec, pageable).map(WorkOrderResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public WorkOrderResponse getWorkOrder(UUID id) {
        WorkOrder wo = getWorkOrderOrThrow(id);
        return WorkOrderResponse.fromEntity(wo);
    }

    @Transactional
    public WorkOrderResponse createWorkOrder(CreateWorkOrderRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String code = generateWorkOrderCode();

        WorkOrder wo = WorkOrder.builder()
                .organizationId(organizationId)
                .projectId(request.projectId())
                .code(code)
                .title(request.title())
                .description(request.description())
                .workType(request.workType())
                .location(request.location())
                .assignedCrewId(request.assignedCrewId())
                .foremanId(request.foremanId())
                .plannedStart(request.plannedStart())
                .plannedEnd(request.plannedEnd())
                .status(WorkOrderStatus.DRAFT)
                .priority(request.priority() != null ? request.priority() : WorkOrderPriority.MEDIUM)
                .build();

        wo = workOrderRepository.save(wo);
        auditService.logCreate("WorkOrder", wo.getId());

        log.info("Наряд-задание создано: {} ({})", wo.getCode(), wo.getId());
        return WorkOrderResponse.fromEntity(wo);
    }

    @Transactional
    public WorkOrderResponse updateWorkOrder(UUID id, UpdateWorkOrderRequest request) {
        WorkOrder wo = getWorkOrderOrThrow(id);

        if (request.title() != null) wo.setTitle(request.title());
        if (request.description() != null) wo.setDescription(request.description());
        if (request.workType() != null) wo.setWorkType(request.workType());
        if (request.location() != null) wo.setLocation(request.location());
        if (request.assignedCrewId() != null) wo.setAssignedCrewId(request.assignedCrewId());
        if (request.foremanId() != null) wo.setForemanId(request.foremanId());
        if (request.plannedStart() != null) wo.setPlannedStart(request.plannedStart());
        if (request.plannedEnd() != null) wo.setPlannedEnd(request.plannedEnd());
        if (request.priority() != null) wo.setPriority(request.priority());
        if (request.completionPercent() != null) wo.setCompletionPercent(request.completionPercent());

        wo = workOrderRepository.save(wo);
        auditService.logUpdate("WorkOrder", wo.getId(), "multiple", null, null);

        log.info("Наряд-задание обновлено: {} ({})", wo.getCode(), wo.getId());
        return WorkOrderResponse.fromEntity(wo);
    }

    @Transactional
    public WorkOrderResponse transitionWorkOrderStatus(UUID id, WorkOrderStatus targetStatus) {
        WorkOrder wo = getWorkOrderOrThrow(id);
        WorkOrderStatus oldStatus = wo.getStatus();

        if (!wo.canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести наряд-задание из статуса %s в %s",
                            oldStatus.getDisplayName(), targetStatus.getDisplayName()));
        }

        wo.setStatus(targetStatus);

        if (targetStatus == WorkOrderStatus.IN_PROGRESS && wo.getActualStart() == null) {
            wo.setActualStart(LocalDate.now());
        }
        if (targetStatus == WorkOrderStatus.COMPLETED) {
            wo.setActualEnd(LocalDate.now());
            wo.setCompletionPercent(100);
        }

        wo = workOrderRepository.save(wo);
        auditService.logStatusChange("WorkOrder", wo.getId(), oldStatus.name(), targetStatus.name());

        log.info("Наряд-задание {} переведено: {} -> {}", wo.getCode(), oldStatus, targetStatus);
        return WorkOrderResponse.fromEntity(wo);
    }

    @Transactional
    public void deleteWorkOrder(UUID id) {
        WorkOrder wo = getWorkOrderOrThrow(id);
        wo.softDelete();
        workOrderRepository.save(wo);
        auditService.logDelete("WorkOrder", id);
        log.info("Наряд-задание удалено: {} ({})", wo.getCode(), id);
    }

    // ========================================================================
    // Daily Reports
    // ========================================================================

    @Transactional(readOnly = true)
    public List<DailyReportResponse> getDailyReportsForWorkOrder(UUID workOrderId) {
        return dailyReportRepository.findByWorkOrderIdAndDeletedFalseOrderByReportDateDesc(workOrderId)
                .stream()
                .map(DailyReportResponse::fromEntity)
                .toList();
    }

    @Transactional
    public DailyReportResponse createDailyReport(CreateDailyReportRequest request) {
        getWorkOrderOrThrow(request.workOrderId());

        DailyReport dr = DailyReport.builder()
                .workOrderId(request.workOrderId())
                .reportDate(request.reportDate())
                .workDone(request.workDone())
                .issues(request.issues())
                .materialsUsed(request.materialsUsed())
                .laborHours(request.laborHours())
                .equipmentHours(request.equipmentHours())
                .weatherImpact(request.weatherImpact())
                .submittedById(request.submittedById())
                .build();

        dr = dailyReportRepository.save(dr);
        auditService.logCreate("DailyReport", dr.getId());

        log.info("Ежедневный отчёт создан: {} для наряд-задания {}", dr.getId(), request.workOrderId());
        return DailyReportResponse.fromEntity(dr);
    }

    @Transactional
    public DailyReportResponse updateDailyReport(UUID id, CreateDailyReportRequest request) {
        DailyReport dr = dailyReportRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Ежедневный отчёт не найден: " + id));

        if (request.reportDate() != null) dr.setReportDate(request.reportDate());
        if (request.workDone() != null) dr.setWorkDone(request.workDone());
        if (request.issues() != null) dr.setIssues(request.issues());
        if (request.materialsUsed() != null) dr.setMaterialsUsed(request.materialsUsed());
        if (request.laborHours() != null) dr.setLaborHours(request.laborHours());
        if (request.equipmentHours() != null) dr.setEquipmentHours(request.equipmentHours());
        if (request.weatherImpact() != null) dr.setWeatherImpact(request.weatherImpact());

        dr = dailyReportRepository.save(dr);
        auditService.logUpdate("DailyReport", dr.getId(), "multiple", null, null);

        log.info("Ежедневный отчёт обновлён: {}", dr.getId());
        return DailyReportResponse.fromEntity(dr);
    }

    @Transactional
    public void deleteDailyReport(UUID id) {
        DailyReport dr = dailyReportRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Ежедневный отчёт не найден: " + id));

        dr.softDelete();
        dailyReportRepository.save(dr);
        auditService.logDelete("DailyReport", id);
        log.info("Ежедневный отчёт удалён: {}", id);
    }

    // ========================================================================
    // Defects
    // ========================================================================

    @Transactional(readOnly = true)
    public DefectResponse getDefect(UUID id) {
        Defect d = getDefectOrThrow(id);
        return DefectResponse.fromEntity(d);
    }

    @Transactional
    public DefectResponse createDefect(CreateDefectRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        String code = generateDefectCode();

        Defect d = Defect.builder()
                .organizationId(organizationId)
                .projectId(request.projectId())
                .code(code)
                .title(request.title())
                .description(request.description())
                .location(request.location())
                .severity(request.severity() != null ? request.severity() : DefectSeverity.MEDIUM)
                .photoUrls(request.photoUrls())
                .detectedById(request.detectedById())
                .assignedToId(request.assignedToId())
                .fixDeadline(request.fixDeadline())
                .status(DefectStatus.OPEN)
                .build();

        d = defectRepository.save(d);
        auditService.logCreate("Defect", d.getId());

        log.info("Дефект создан: {} ({})", d.getCode(), d.getId());
        return DefectResponse.fromEntity(d);
    }

    @Transactional
    public DefectResponse transitionDefectStatus(UUID id, DefectStatus targetStatus) {
        Defect d = getDefectOrThrow(id);
        DefectStatus oldStatus = d.getStatus();

        if (!d.canTransitionTo(targetStatus)) {
            throw new IllegalStateException(
                    String.format("Невозможно перевести дефект из статуса %s в %s",
                            oldStatus.getDisplayName(), targetStatus.getDisplayName()));
        }

        d.setStatus(targetStatus);
        if (targetStatus == DefectStatus.FIXED) {
            d.setFixedAt(Instant.now());
        }

        d = defectRepository.save(d);
        auditService.logStatusChange("Defect", d.getId(), oldStatus.name(), targetStatus.name());

        log.info("Дефект {} переведён: {} -> {}", d.getCode(), oldStatus, targetStatus);
        return DefectResponse.fromEntity(d);
    }

    @Transactional
    public DefectResponse updateDefect(UUID id, CreateDefectRequest request) {
        Defect d = getDefectOrThrow(id);

        if (request.title() != null) d.setTitle(request.title());
        if (request.description() != null) d.setDescription(request.description());
        if (request.location() != null) d.setLocation(request.location());
        if (request.severity() != null) d.setSeverity(request.severity());
        if (request.photoUrls() != null) d.setPhotoUrls(request.photoUrls());
        if (request.assignedToId() != null) d.setAssignedToId(request.assignedToId());
        if (request.fixDeadline() != null) d.setFixDeadline(request.fixDeadline());

        d = defectRepository.save(d);
        auditService.logUpdate("Defect", d.getId(), "multiple", null, null);

        log.info("Дефект обновлён: {} ({})", d.getCode(), d.getId());
        return DefectResponse.fromEntity(d);
    }

    @Transactional
    public void deleteDefect(UUID id) {
        Defect d = getDefectOrThrow(id);
        d.softDelete();
        defectRepository.save(d);
        auditService.logDelete("Defect", id);
        log.info("Дефект удалён: {} ({})", d.getCode(), id);
    }

    // ========================================================================
    // Private helpers
    // ========================================================================

    private WorkOrder getWorkOrderOrThrow(UUID id) {
        return workOrderRepository.findById(id)
                .filter(wo -> !wo.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Наряд-задание не найдено: " + id));
    }

    private Defect getDefectOrThrow(UUID id) {
        return defectRepository.findById(id)
                .filter(d -> !d.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Дефект не найден: " + id));
    }

    private String generateWorkOrderCode() {
        long seq = workOrderRepository.getNextCodeSequence();
        return String.format("НЗ-%05d", seq);
    }

    private String generateDefectCode() {
        long seq = defectRepository.getNextCodeSequence();
        return String.format("ДЕФ-%05d", seq);
    }
}
