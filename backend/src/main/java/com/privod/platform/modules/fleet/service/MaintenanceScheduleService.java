package com.privod.platform.modules.fleet.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.fleet.domain.MaintenanceScheduleRule;
import com.privod.platform.modules.fleet.domain.MaintenanceType;
import com.privod.platform.modules.fleet.domain.Vehicle;
import com.privod.platform.modules.fleet.repository.MaintenanceScheduleRuleRepository;
import com.privod.platform.modules.fleet.repository.VehicleRepository;
import com.privod.platform.modules.fleet.web.dto.ComplianceDashboardResponse;
import com.privod.platform.modules.fleet.web.dto.ComplianceDashboardResponse.VehicleComplianceItem;
import com.privod.platform.modules.fleet.web.dto.CreateScheduleRuleRequest;
import com.privod.platform.modules.fleet.web.dto.MaintenanceDueItem;
import com.privod.platform.modules.fleet.web.dto.ScheduleRuleResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class MaintenanceScheduleService {

    private final MaintenanceScheduleRuleRepository ruleRepository;
    private final VehicleRepository vehicleRepository;
    private final AuditService auditService;

    @Transactional(readOnly = true)
    public Page<ScheduleRuleResponse> listRules(UUID vehicleId, Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (vehicleId != null) {
            return ruleRepository.findByOrganizationIdAndVehicleIdAndDeletedFalse(organizationId, vehicleId, pageable)
                    .map(r -> toResponse(r));
        }
        return ruleRepository.findByOrganizationIdAndDeletedFalse(organizationId, pageable)
                .map(r -> toResponse(r));
    }

    @Transactional(readOnly = true)
    public ScheduleRuleResponse getRule(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        MaintenanceScheduleRule rule = getRuleOrThrow(id, organizationId);
        return toResponse(rule);
    }

    @Transactional
    public ScheduleRuleResponse createRule(CreateScheduleRuleRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        if (request.vehicleId() != null) {
            getVehicleOrThrow(request.vehicleId(), organizationId);
        }

        MaintenanceScheduleRule rule = MaintenanceScheduleRule.builder()
                .organizationId(organizationId)
                .vehicleId(request.vehicleId())
                .name(request.name())
                .description(request.description())
                .maintenanceType(request.maintenanceType() != null ? request.maintenanceType() : MaintenanceType.SCHEDULED)
                .intervalHours(request.intervalHours())
                .intervalMileage(request.intervalMileage())
                .intervalDays(request.intervalDays())
                .leadTimeHours(request.leadTimeHours() != null ? request.leadTimeHours() : new BigDecimal("50"))
                .leadTimeMileage(request.leadTimeMileage() != null ? request.leadTimeMileage() : new BigDecimal("500"))
                .leadTimeDays(request.leadTimeDays() != null ? request.leadTimeDays() : 7)
                .isActive(true)
                .appliesToAllVehicles(Boolean.TRUE.equals(request.appliesToAllVehicles()))
                .notes(request.notes())
                .build();

        rule = ruleRepository.save(rule);
        auditService.logCreate("MaintenanceScheduleRule", rule.getId());
        log.info("Maintenance schedule rule created: {} ({})", rule.getName(), rule.getId());
        return toResponse(rule);
    }

    @Transactional
    public ScheduleRuleResponse updateRule(UUID id, CreateScheduleRuleRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        MaintenanceScheduleRule rule = getRuleOrThrow(id, organizationId);

        if (request.vehicleId() != null) {
            getVehicleOrThrow(request.vehicleId(), organizationId);
            rule.setVehicleId(request.vehicleId());
        }
        if (request.name() != null) rule.setName(request.name());
        if (request.description() != null) rule.setDescription(request.description());
        if (request.maintenanceType() != null) rule.setMaintenanceType(request.maintenanceType());
        if (request.intervalHours() != null) rule.setIntervalHours(request.intervalHours());
        if (request.intervalMileage() != null) rule.setIntervalMileage(request.intervalMileage());
        if (request.intervalDays() != null) rule.setIntervalDays(request.intervalDays());
        if (request.leadTimeHours() != null) rule.setLeadTimeHours(request.leadTimeHours());
        if (request.leadTimeMileage() != null) rule.setLeadTimeMileage(request.leadTimeMileage());
        if (request.leadTimeDays() != null) rule.setLeadTimeDays(request.leadTimeDays());
        if (request.appliesToAllVehicles() != null) rule.setAppliesToAllVehicles(request.appliesToAllVehicles());
        if (request.notes() != null) rule.setNotes(request.notes());

        rule = ruleRepository.save(rule);
        auditService.logUpdate("MaintenanceScheduleRule", rule.getId(), "multiple", null, null);
        return toResponse(rule);
    }

    @Transactional
    public void toggleRule(UUID id, boolean active) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        MaintenanceScheduleRule rule = getRuleOrThrow(id, organizationId);
        rule.setIsActive(active);
        ruleRepository.save(rule);
        log.info("Maintenance schedule rule {} {}: {}", active ? "activated" : "deactivated", rule.getName(), rule.getId());
    }

    @Transactional
    public void deleteRule(UUID id) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        MaintenanceScheduleRule rule = getRuleOrThrow(id, organizationId);
        rule.softDelete();
        ruleRepository.save(rule);
        auditService.logDelete("MaintenanceScheduleRule", rule.getId());
    }

    @Transactional(readOnly = true)
    public List<MaintenanceDueItem> getDueMaintenanceItems() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        List<MaintenanceScheduleRule> rules = ruleRepository.findAllActiveRules(organizationId);
        List<Vehicle> vehicles = vehicleRepository.findByOrganizationIdAndDeletedFalse(organizationId,
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        List<MaintenanceDueItem> dueItems = new ArrayList<>();

        for (Vehicle vehicle : vehicles) {
            List<MaintenanceScheduleRule> applicableRules = rules.stream()
                    .filter(r -> Boolean.TRUE.equals(r.getAppliesToAllVehicles()) ||
                            vehicle.getId().equals(r.getVehicleId()))
                    .toList();

            for (MaintenanceScheduleRule rule : applicableRules) {
                checkHoursDue(vehicle, rule, dueItems);
                checkMileageDue(vehicle, rule, dueItems);
                checkDateDue(vehicle, rule, dueItems);
            }
        }

        return dueItems;
    }

    @Transactional(readOnly = true)
    public ComplianceDashboardResponse getComplianceDashboard() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        List<Vehicle> vehicles = vehicleRepository.findByOrganizationIdAndDeletedFalse(organizationId,
                org.springframework.data.domain.Pageable.unpaged()).getContent();

        List<MaintenanceDueItem> dueItems = getDueMaintenanceItems();
        int overdueCount = (int) dueItems.stream().filter(MaintenanceDueItem::overdue).count();
        int approachingCount = dueItems.size() - overdueCount;

        LocalDate today = LocalDate.now();
        LocalDate soon = today.plusDays(30);

        List<VehicleComplianceItem> insuranceAlerts = new ArrayList<>();
        List<VehicleComplianceItem> techInspectionAlerts = new ArrayList<>();
        int expiredIns = 0, expiringIns = 0, expiredTech = 0, expiringTech = 0;

        for (Vehicle v : vehicles) {
            String vName = buildVehicleName(v);

            if (v.getInsuranceExpiryDate() != null) {
                long daysRemaining = ChronoUnit.DAYS.between(today, v.getInsuranceExpiryDate());
                if (daysRemaining < 0) {
                    expiredIns++;
                    insuranceAlerts.add(new VehicleComplianceItem(v.getId().toString(), v.getCode(), vName,
                            v.getInsuranceExpiryDate().toString(), (int) daysRemaining, true));
                } else if (v.getInsuranceExpiryDate().isBefore(soon)) {
                    expiringIns++;
                    insuranceAlerts.add(new VehicleComplianceItem(v.getId().toString(), v.getCode(), vName,
                            v.getInsuranceExpiryDate().toString(), (int) daysRemaining, false));
                }
            }

            if (v.getTechInspectionExpiryDate() != null) {
                long daysRemaining = ChronoUnit.DAYS.between(today, v.getTechInspectionExpiryDate());
                if (daysRemaining < 0) {
                    expiredTech++;
                    techInspectionAlerts.add(new VehicleComplianceItem(v.getId().toString(), v.getCode(), vName,
                            v.getTechInspectionExpiryDate().toString(), (int) daysRemaining, true));
                } else if (v.getTechInspectionExpiryDate().isBefore(soon)) {
                    expiringTech++;
                    techInspectionAlerts.add(new VehicleComplianceItem(v.getId().toString(), v.getCode(), vName,
                            v.getTechInspectionExpiryDate().toString(), (int) daysRemaining, false));
                }
            }
        }

        return new ComplianceDashboardResponse(
                vehicles.size(), overdueCount, approachingCount,
                expiredIns, expiringIns, expiredTech, expiringTech,
                dueItems, insuranceAlerts, techInspectionAlerts
        );
    }

    private void checkHoursDue(Vehicle vehicle, MaintenanceScheduleRule rule, List<MaintenanceDueItem> items) {
        if (rule.getIntervalHours() == null || vehicle.getCurrentHours() == null) return;
        BigDecimal currentHours = vehicle.getCurrentHours();
        BigDecimal interval = rule.getIntervalHours();
        BigDecimal leadTime = rule.getLeadTimeHours() != null ? rule.getLeadTimeHours() : BigDecimal.ZERO;

        // Calculate next service threshold
        BigDecimal remainder = currentHours.remainder(interval);
        BigDecimal nextThreshold = currentHours.subtract(remainder).add(interval);
        BigDecimal alertThreshold = nextThreshold.subtract(leadTime);

        if (currentHours.compareTo(nextThreshold) >= 0) {
            items.add(new MaintenanceDueItem(vehicle.getId(), vehicle.getCode(), buildVehicleName(vehicle),
                    rule.getId(), rule.getName(), rule.getMaintenanceType().getDisplayName(),
                    "HOURS_EXCEEDED", currentHours, nextThreshold, vehicle.getCurrentMileage(), null, null, true));
        } else if (currentHours.compareTo(alertThreshold) >= 0) {
            items.add(new MaintenanceDueItem(vehicle.getId(), vehicle.getCode(), buildVehicleName(vehicle),
                    rule.getId(), rule.getName(), rule.getMaintenanceType().getDisplayName(),
                    "HOURS_APPROACHING", currentHours, nextThreshold, vehicle.getCurrentMileage(), null, null, false));
        }
    }

    private void checkMileageDue(Vehicle vehicle, MaintenanceScheduleRule rule, List<MaintenanceDueItem> items) {
        if (rule.getIntervalMileage() == null || vehicle.getCurrentMileage() == null) return;
        BigDecimal currentMileage = vehicle.getCurrentMileage();
        BigDecimal interval = rule.getIntervalMileage();
        BigDecimal leadTime = rule.getLeadTimeMileage() != null ? rule.getLeadTimeMileage() : BigDecimal.ZERO;

        BigDecimal remainder = currentMileage.remainder(interval);
        BigDecimal nextThreshold = currentMileage.subtract(remainder).add(interval);
        BigDecimal alertThreshold = nextThreshold.subtract(leadTime);

        if (currentMileage.compareTo(nextThreshold) >= 0) {
            items.add(new MaintenanceDueItem(vehicle.getId(), vehicle.getCode(), buildVehicleName(vehicle),
                    rule.getId(), rule.getName(), rule.getMaintenanceType().getDisplayName(),
                    "MILEAGE_EXCEEDED", vehicle.getCurrentHours(), null, currentMileage, nextThreshold, null, true));
        } else if (currentMileage.compareTo(alertThreshold) >= 0) {
            items.add(new MaintenanceDueItem(vehicle.getId(), vehicle.getCode(), buildVehicleName(vehicle),
                    rule.getId(), rule.getName(), rule.getMaintenanceType().getDisplayName(),
                    "MILEAGE_APPROACHING", vehicle.getCurrentHours(), null, currentMileage, nextThreshold, null, false));
        }
    }

    private void checkDateDue(Vehicle vehicle, MaintenanceScheduleRule rule, List<MaintenanceDueItem> items) {
        if (rule.getIntervalDays() == null) return;
        // Date-based scheduling is simplified: check if leadTimeDays before next interval
        // For date-based, we just check if today + leadTimeDays exceeds the interval from rule creation
        // In a full system, this would track per-vehicle last service date
    }

    private ScheduleRuleResponse toResponse(MaintenanceScheduleRule rule) {
        String vehicleName = null;
        if (rule.getVehicleId() != null) {
            vehicleName = vehicleRepository.findById(rule.getVehicleId())
                    .filter(v -> !v.isDeleted())
                    .map(this::buildVehicleName)
                    .orElse(null);
        }
        return ScheduleRuleResponse.fromEntity(rule, vehicleName);
    }

    private String buildVehicleName(Vehicle v) {
        if (v.getMake() != null) {
            return v.getMake() + " " + (v.getModel() != null ? v.getModel() : "") + " (" + v.getCode() + ")";
        }
        return v.getCode();
    }

    private MaintenanceScheduleRule getRuleOrThrow(UUID id, UUID organizationId) {
        MaintenanceScheduleRule rule = ruleRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Правило обслуживания не найдено: " + id));
        if (!organizationId.equals(rule.getOrganizationId())) {
            throw new EntityNotFoundException("Правило обслуживания не найдено: " + id);
        }
        return rule;
    }

    private Vehicle getVehicleOrThrow(UUID vehicleId, UUID organizationId) {
        return vehicleRepository.findByIdAndOrganizationIdAndDeletedFalse(vehicleId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Техника не найдена: " + vehicleId));
    }
}
