package com.privod.platform.modules.hr.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.domain.HrWorkOrder;
import com.privod.platform.modules.hr.domain.QualificationRecord;
import com.privod.platform.modules.hr.domain.StaffingPosition;
import com.privod.platform.modules.hr.domain.StaffingVacancy;
import com.privod.platform.modules.hr.domain.TimesheetT13Cell;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import com.privod.platform.modules.hr.repository.HrWorkOrderRepository;
import com.privod.platform.modules.hr.repository.QualificationRecordRepository;
import com.privod.platform.modules.hr.repository.StaffingPositionRepository;
import com.privod.platform.modules.hr.repository.StaffingVacancyRepository;
import com.privod.platform.modules.hr.repository.TimesheetT13CellRepository;
import com.privod.platform.modules.hr.web.dto.CreateHrWorkOrderRequest;
import com.privod.platform.modules.hr.web.dto.CreateQualificationRecordRequest;
import com.privod.platform.modules.hr.web.dto.CreateStaffingVacancyRequest;
import com.privod.platform.modules.hr.web.dto.HrWorkOrderResponse;
import com.privod.platform.modules.hr.web.dto.QualificationRecordResponse;
import com.privod.platform.modules.hr.web.dto.SeniorityRecordResponse;
import com.privod.platform.modules.hr.web.dto.StaffingPositionResponse;
import com.privod.platform.modules.hr.web.dto.StaffingVacancyResponse;
import com.privod.platform.modules.hr.web.dto.TimesheetT13CellResponse;
import com.privod.platform.modules.hr.web.dto.TimesheetT13RowResponse;
import com.privod.platform.modules.hr.web.dto.UpdateTimesheetT13CellRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class HrExtendedService {

    private final StaffingPositionRepository staffingPositionRepository;
    private final StaffingVacancyRepository staffingVacancyRepository;
    private final TimesheetT13CellRepository timesheetT13CellRepository;
    private final HrWorkOrderRepository hrWorkOrderRepository;
    private final QualificationRecordRepository qualificationRecordRepository;
    private final EmployeeRepository employeeRepository;

    // -----------------------------------------------------------------------
    // Staffing Schedule
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<StaffingPositionResponse> getStaffingSchedule(String department, String vacancyStatus) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        List<StaffingPosition> positions;
        if (department != null && !department.isBlank()) {
            positions = staffingPositionRepository
                    .findByOrganizationIdAndDepartmentAndDeletedFalseOrderByPositionAsc(orgId, department);
        } else {
            positions = staffingPositionRepository
                    .findByOrganizationIdAndDeletedFalseOrderByDepartmentAscPositionAsc(orgId);
        }

        if (positions.isEmpty()) {
            return List.of();
        }

        List<UUID> positionIds = positions.stream().map(StaffingPosition::getId).toList();
        List<StaffingVacancy> allVacancies = staffingVacancyRepository.findByStaffingPositionIdInAndDeletedFalse(positionIds);

        Map<UUID, List<StaffingVacancy>> vacanciesByPositionId = allVacancies.stream()
                .collect(Collectors.groupingBy(StaffingVacancy::getStaffingPositionId));

        return positions.stream().map(pos -> {
            List<StaffingVacancy> posVacancies = vacanciesByPositionId.getOrDefault(pos.getId(), List.of());

            // Filter by vacancyStatus if specified
            List<StaffingVacancyResponse> vacancyResponses;
            if (vacancyStatus != null && !vacancyStatus.isBlank()) {
                StaffingVacancy.VacancyStatus filterStatus;
                try {
                    filterStatus = StaffingVacancy.VacancyStatus.valueOf(vacancyStatus.toUpperCase());
                } catch (IllegalArgumentException e) {
                    filterStatus = null;
                }
                final StaffingVacancy.VacancyStatus finalFilterStatus = filterStatus;
                vacancyResponses = posVacancies.stream()
                        .filter(v -> finalFilterStatus == null || v.getStatus() == finalFilterStatus)
                        .map(StaffingVacancyResponse::fromEntity)
                        .toList();
            } else {
                vacancyResponses = posVacancies.stream()
                        .map(StaffingVacancyResponse::fromEntity)
                        .toList();
            }

            return StaffingPositionResponse.fromEntity(pos, vacancyResponses);
        }).toList();
    }

    @Transactional
    public StaffingPositionResponse createVacancy(CreateStaffingVacancyRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        StaffingPosition position = StaffingPosition.builder()
                .organizationId(orgId)
                .department(request.department())
                .position(request.position())
                .grade(request.grade())
                .salaryMin(request.salaryMin())
                .salaryMax(request.salaryMax())
                .filledCount(0)
                .totalCount(1)
                .build();
        position = staffingPositionRepository.save(position);

        StaffingVacancy vacancy = StaffingVacancy.builder()
                .staffingPositionId(position.getId())
                .status(StaffingVacancy.VacancyStatus.OPEN)
                .build();
        vacancy = staffingVacancyRepository.save(vacancy);

        log.info("Staffing vacancy created: position={}, department={}", request.position(), request.department());

        List<StaffingVacancyResponse> vacancyResponses = List.of(StaffingVacancyResponse.fromEntity(vacancy));
        return StaffingPositionResponse.fromEntity(position, vacancyResponses);
    }

    // -----------------------------------------------------------------------
    // Timesheet T-13
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<TimesheetT13RowResponse> getTimesheetT13(UUID projectId, int month, int year) {
        List<TimesheetT13Cell> cells = timesheetT13CellRepository
                .findByProjectIdAndMonthAndYearAndDeletedFalse(projectId, month, year);

        // Group cells by employee
        Map<UUID, List<TimesheetT13Cell>> cellsByEmployee = cells.stream()
                .collect(Collectors.groupingBy(TimesheetT13Cell::getEmployeeId, LinkedHashMap::new, Collectors.toList()));

        List<TimesheetT13RowResponse> rows = new ArrayList<>();
        for (Map.Entry<UUID, List<TimesheetT13Cell>> entry : cellsByEmployee.entrySet()) {
            UUID empId = entry.getKey();
            List<TimesheetT13Cell> empCells = entry.getValue();

            // Try to get employee name and position
            String employeeName;
            String position;
            var employeeOpt = employeeRepository.findById(empId);
            if (employeeOpt.isPresent()) {
                Employee emp = employeeOpt.get();
                employeeName = emp.getFullName() != null ? emp.getFullName() : "";
                position = emp.getPosition() != null ? emp.getPosition() : "";
            } else {
                employeeName = "";
                position = "";
            }

            final String finalEmployeeName = employeeName;

            List<TimesheetT13CellResponse> cellResponses = empCells.stream()
                    .map(c -> new TimesheetT13CellResponse(
                            c.getEmployeeId(),
                            finalEmployeeName,
                            c.getDay(),
                            c.getCode(),
                            c.getDayHours(),
                            c.getNightHours()
                    ))
                    .toList();

            int totalDays = (int) empCells.stream().filter(c -> c.getDayHours().compareTo(BigDecimal.ZERO) > 0).count();
            BigDecimal totalHours = empCells.stream().map(TimesheetT13Cell::getDayHours).reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totalNightHours = empCells.stream().map(TimesheetT13Cell::getNightHours).reduce(BigDecimal.ZERO, BigDecimal::add);

            String finalPosition = position;
            rows.add(new TimesheetT13RowResponse(
                    empId, finalEmployeeName, finalPosition, cellResponses, totalDays, totalHours, totalNightHours
            ));
        }

        return rows;
    }

    @Transactional
    public void updateTimesheetT13Cell(UUID projectId, int month, int year, UpdateTimesheetT13CellRequest request) {
        var existing = timesheetT13CellRepository
                .findByProjectIdAndEmployeeIdAndMonthAndYearAndDayAndDeletedFalse(
                        projectId, request.employeeId(), month, year, request.day());

        TimesheetT13Cell cell;
        if (existing.isPresent()) {
            cell = existing.get();
        } else {
            cell = TimesheetT13Cell.builder()
                    .projectId(projectId)
                    .employeeId(request.employeeId())
                    .month(month)
                    .year(year)
                    .day(request.day())
                    .build();
        }

        if (request.code() != null) cell.setCode(request.code());
        if (request.dayHours() != null) cell.setDayHours(request.dayHours());
        if (request.nightHours() != null) cell.setNightHours(request.nightHours());

        timesheetT13CellRepository.save(cell);
        log.info("T-13 cell updated: project={}, employee={}, day={}", projectId, request.employeeId(), request.day());
    }

    // -----------------------------------------------------------------------
    // Work Orders
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<HrWorkOrderResponse> getWorkOrders(String type, String status) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        HrWorkOrder.HrWorkOrderType typeEnum = parseWorkOrderType(type);
        HrWorkOrder.HrWorkOrderStatus statusEnum = parseWorkOrderStatus(status);

        List<HrWorkOrder> orders;
        if (typeEnum != null && statusEnum != null) {
            orders = hrWorkOrderRepository.findByOrganizationIdAndTypeAndStatusAndDeletedFalseOrderByDateDesc(orgId, typeEnum, statusEnum);
        } else if (typeEnum != null) {
            orders = hrWorkOrderRepository.findByOrganizationIdAndTypeAndDeletedFalseOrderByDateDesc(orgId, typeEnum);
        } else if (statusEnum != null) {
            orders = hrWorkOrderRepository.findByOrganizationIdAndStatusAndDeletedFalseOrderByDateDesc(orgId, statusEnum);
        } else {
            orders = hrWorkOrderRepository.findByOrganizationIdAndDeletedFalseOrderByDateDesc(orgId);
        }

        return orders.stream().map(HrWorkOrderResponse::fromEntity).toList();
    }

    @Transactional
    public HrWorkOrderResponse createWorkOrder(CreateHrWorkOrderRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        long seq = hrWorkOrderRepository.countByOrganizationIdAndDeletedFalse(orgId) + 1;
        String number = String.format("WO-%05d", seq);

        HrWorkOrder.HrWorkOrderType typeEnum = parseWorkOrderType(request.type());
        if (typeEnum == null) {
            typeEnum = HrWorkOrder.HrWorkOrderType.TASK_ORDER;
        }

        String permits = request.requiredPermits() != null
                ? String.join(",", request.requiredPermits())
                : null;

        HrWorkOrder order = HrWorkOrder.builder()
                .organizationId(orgId)
                .number(number)
                .type(typeEnum)
                .projectId(request.projectId())
                .projectName(null) // Could be resolved from ProjectRepository
                .crewName(request.crewName())
                .workDescription(request.workDescription())
                .date(request.date())
                .endDate(request.endDate())
                .safetyRequirements(request.safetyRequirements())
                .hazardousConditions(request.hazardousConditions())
                .requiredPermits(permits)
                .status(HrWorkOrder.HrWorkOrderStatus.DRAFT)
                .build();

        order = hrWorkOrderRepository.save(order);
        log.info("HR work order created: {} ({})", number, order.getId());

        return HrWorkOrderResponse.fromEntity(order);
    }

    // -----------------------------------------------------------------------
    // Qualifications & Permits
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<QualificationRecordResponse> getQualifications(String qualificationType, String status) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        QualificationRecord.QualificationStatus statusEnum = parseQualificationStatus(status);

        List<QualificationRecord> records;
        if (qualificationType != null && !qualificationType.isBlank() && statusEnum != null) {
            records = qualificationRecordRepository
                    .findByOrganizationIdAndQualificationTypeAndStatusAndDeletedFalseOrderByExpiryDateAsc(orgId, qualificationType, statusEnum);
        } else if (qualificationType != null && !qualificationType.isBlank()) {
            records = qualificationRecordRepository
                    .findByOrganizationIdAndQualificationTypeAndDeletedFalseOrderByExpiryDateAsc(orgId, qualificationType);
        } else if (statusEnum != null) {
            records = qualificationRecordRepository
                    .findByOrganizationIdAndStatusAndDeletedFalseOrderByExpiryDateAsc(orgId, statusEnum);
        } else {
            records = qualificationRecordRepository
                    .findByOrganizationIdAndDeletedFalseOrderByExpiryDateAsc(orgId);
        }

        return records.stream().map(QualificationRecordResponse::fromEntity).toList();
    }

    @Transactional
    public QualificationRecordResponse createQualification(CreateQualificationRecordRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Determine status based on expiry date
        QualificationRecord.QualificationStatus status;
        long daysUntilExpiry = java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), request.expiryDate());
        if (daysUntilExpiry < 0) {
            status = QualificationRecord.QualificationStatus.EXPIRED;
        } else if (daysUntilExpiry <= 30) {
            status = QualificationRecord.QualificationStatus.EXPIRING;
        } else {
            status = QualificationRecord.QualificationStatus.VALID;
        }

        // Try to get employee name
        String employeeName = "";
        var empOpt = employeeRepository.findById(request.employeeId());
        if (empOpt.isPresent()) {
            employeeName = empOpt.get().getFullName() != null ? empOpt.get().getFullName() : "";
        }

        QualificationRecord record = QualificationRecord.builder()
                .organizationId(orgId)
                .employeeId(request.employeeId())
                .employeeName(employeeName)
                .qualificationType(request.qualificationType())
                .certificateNumber(request.certificateNumber())
                .issueDate(request.issueDate())
                .expiryDate(request.expiryDate())
                .status(status)
                .build();

        record = qualificationRecordRepository.save(record);
        log.info("Qualification record created for employee {}: {} ({})",
                request.employeeId(), request.qualificationType(), record.getId());

        return QualificationRecordResponse.fromEntity(record);
    }

    // -----------------------------------------------------------------------
    // Seniority & Leave Report
    // -----------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<SeniorityRecordResponse> getSeniorityReport() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        List<Employee> employees = employeeRepository.findByOrganizationIdAndDeletedFalse(orgId);

        return employees.stream().map(emp -> {
            LocalDate hireDate = emp.getHireDate();
            LocalDate now = LocalDate.now();
            Period period = Period.between(hireDate, now);

            int seniorityYears = period.getYears();
            int seniorityMonths = period.getMonths();
            int seniorityDays = period.getDays();

            // Russian labor law: base 28 calendar days + additional for seniority
            int baseLeave = 28;
            int additionalLeave = 0;
            if (seniorityYears >= 5) additionalLeave += 3;
            if (seniorityYears >= 10) additionalLeave += 2;
            int totalLeave = baseLeave + additionalLeave;

            // Stub: used/remaining leave would come from a leave tracking module
            int usedLeave = 0;
            int remainingLeave = totalLeave;

            return new SeniorityRecordResponse(
                    emp.getId(),
                    emp.getFullName() != null ? emp.getFullName() : "",
                    hireDate,
                    seniorityYears,
                    seniorityMonths,
                    seniorityDays,
                    baseLeave,
                    additionalLeave,
                    totalLeave,
                    usedLeave,
                    remainingLeave
            );
        }).toList();
    }

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private HrWorkOrder.HrWorkOrderType parseWorkOrderType(String type) {
        if (type == null || type.isBlank()) return null;
        try {
            return HrWorkOrder.HrWorkOrderType.valueOf(type.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private HrWorkOrder.HrWorkOrderStatus parseWorkOrderStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return HrWorkOrder.HrWorkOrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private QualificationRecord.QualificationStatus parseQualificationStatus(String status) {
        if (status == null || status.isBlank()) return null;
        try {
            return QualificationRecord.QualificationStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
