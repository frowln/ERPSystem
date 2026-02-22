package com.privod.platform.modules.gpsTimesheet.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.gpsTimesheet.domain.CheckEventType;
import com.privod.platform.modules.gpsTimesheet.domain.GpsCheckEvent;
import com.privod.platform.modules.gpsTimesheet.domain.GpsTimesheetEntry;
import com.privod.platform.modules.gpsTimesheet.domain.GpsTimesheetSummary;
import com.privod.platform.modules.gpsTimesheet.domain.SiteGeofence;
import com.privod.platform.modules.gpsTimesheet.repository.GpsCheckEventRepository;
import com.privod.platform.modules.gpsTimesheet.repository.GpsTimesheetEntryRepository;
import com.privod.platform.modules.gpsTimesheet.repository.GpsTimesheetSummaryRepository;
import com.privod.platform.modules.gpsTimesheet.repository.SiteGeofenceRepository;
import com.privod.platform.modules.gpsTimesheet.web.dto.CreateSiteGeofenceRequest;
import com.privod.platform.modules.gpsTimesheet.web.dto.GpsCheckEventResponse;
import com.privod.platform.modules.gpsTimesheet.web.dto.GpsCheckInRequest;
import com.privod.platform.modules.gpsTimesheet.web.dto.GpsCheckOutRequest;
import com.privod.platform.modules.gpsTimesheet.web.dto.GpsTimesheetEntryResponse;
import com.privod.platform.modules.gpsTimesheet.web.dto.GpsTimesheetSummaryResponse;
import com.privod.platform.modules.gpsTimesheet.web.dto.SiteGeofenceResponse;
import com.privod.platform.modules.gpsTimesheet.web.dto.TimesheetDashboardResponse;
import com.privod.platform.modules.gpsTimesheet.web.dto.UpdateSiteGeofenceRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GpsTimesheetService {

    private static final double EARTH_RADIUS_METERS = 6_371_000.0;

    private final SiteGeofenceRepository geofenceRepository;
    private final GpsCheckEventRepository checkEventRepository;
    private final GpsTimesheetEntryRepository entryRepository;
    private final GpsTimesheetSummaryRepository summaryRepository;
    private final AuditService auditService;

    // ───────── Geofence CRUD ─────────

    @Transactional(readOnly = true)
    public Page<SiteGeofenceResponse> listGeofences(UUID projectId, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (projectId != null) {
            return geofenceRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId, pageable)
                    .map(SiteGeofenceResponse::fromEntity);
        }
        return geofenceRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(SiteGeofenceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public SiteGeofenceResponse getGeofence(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        SiteGeofence fence = getGeofenceOrThrow(id, orgId);
        return SiteGeofenceResponse.fromEntity(fence);
    }

    @Transactional
    public SiteGeofenceResponse createGeofence(CreateSiteGeofenceRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        SiteGeofence fence = SiteGeofence.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .name(request.name())
                .centerLatitude(request.centerLatitude())
                .centerLongitude(request.centerLongitude())
                .radiusMeters(request.radiusMeters() != null ? request.radiusMeters() : 100.0)
                .polygonJson(request.polygonJson())
                .isActive(true)
                .build();

        fence = geofenceRepository.save(fence);
        auditService.logCreate("SiteGeofence", fence.getId());

        log.info("Site geofence created: {} for project {} ({})", fence.getName(),
                fence.getProjectId(), fence.getId());
        return SiteGeofenceResponse.fromEntity(fence);
    }

    @Transactional
    public SiteGeofenceResponse updateGeofence(UUID id, UpdateSiteGeofenceRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        SiteGeofence fence = getGeofenceOrThrow(id, orgId);

        if (request.projectId() != null) fence.setProjectId(request.projectId());
        if (request.name() != null) fence.setName(request.name());
        if (request.centerLatitude() != null) fence.setCenterLatitude(request.centerLatitude());
        if (request.centerLongitude() != null) fence.setCenterLongitude(request.centerLongitude());
        if (request.radiusMeters() != null) fence.setRadiusMeters(request.radiusMeters());
        if (request.polygonJson() != null) fence.setPolygonJson(request.polygonJson());
        if (request.isActive() != null) fence.setActive(request.isActive());

        fence = geofenceRepository.save(fence);
        auditService.logUpdate("SiteGeofence", fence.getId(), "multiple", null, null);

        log.info("Site geofence updated: {} ({})", fence.getName(), fence.getId());
        return SiteGeofenceResponse.fromEntity(fence);
    }

    @Transactional
    public void deleteGeofence(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        SiteGeofence fence = getGeofenceOrThrow(id, orgId);
        fence.softDelete();
        geofenceRepository.save(fence);
        auditService.logDelete("SiteGeofence", fence.getId());
        log.info("Site geofence soft-deleted: {} ({})", fence.getName(), fence.getId());
    }

    // ───────── Check-in / Check-out ─────────

    @Transactional
    public GpsCheckEventResponse checkIn(GpsCheckInRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Check for existing open check-in
        List<GpsCheckEvent> openCheckIns = checkEventRepository.findOpenCheckIns(orgId, request.employeeId());
        if (!openCheckIns.isEmpty()) {
            throw new IllegalStateException("Сотрудник уже отмечен на объекте. Сначала выполните check-out.");
        }

        // Find matching geofence
        List<SiteGeofence> activeFences = geofenceRepository.findActiveByOrganizationId(orgId);
        SiteGeofence matchedFence = null;
        boolean withinGeofence = false;

        for (SiteGeofence fence : activeFences) {
            if (isWithinGeofence(request.latitude(), request.longitude(), fence)) {
                matchedFence = fence;
                withinGeofence = true;
                break;
            }
        }

        UUID projectId = request.projectId();
        if (projectId == null && matchedFence != null) {
            projectId = matchedFence.getProjectId();
        }

        Instant now = Instant.now();

        GpsCheckEvent event = GpsCheckEvent.builder()
                .organizationId(orgId)
                .employeeId(request.employeeId())
                .projectId(projectId)
                .siteGeofenceId(matchedFence != null ? matchedFence.getId() : null)
                .eventType(CheckEventType.CHECK_IN)
                .latitude(request.latitude())
                .longitude(request.longitude())
                .accuracyMeters(request.accuracyMeters())
                .isWithinGeofence(withinGeofence)
                .deviceId(request.deviceId())
                .recordedAt(now)
                .build();

        event = checkEventRepository.save(event);
        auditService.logCreate("GpsCheckEvent", event.getId());

        // Create open timesheet entry
        LocalDate workDate = now.atZone(ZoneId.systemDefault()).toLocalDate();
        GpsTimesheetEntry entry = GpsTimesheetEntry.builder()
                .organizationId(orgId)
                .employeeId(request.employeeId())
                .projectId(projectId)
                .checkInEventId(event.getId())
                .workDate(workDate)
                .checkInTime(now)
                .isVerified(false)
                .isGeofenceVerified(withinGeofence)
                .build();

        entry = entryRepository.save(entry);
        auditService.logCreate("GpsTimesheetEntry", entry.getId());

        log.info("GPS check-in: employee {} at ({}, {}), within geofence: {}, entry: {}",
                request.employeeId(), request.latitude(), request.longitude(),
                withinGeofence, entry.getId());

        return GpsCheckEventResponse.fromEntity(event);
    }

    @Transactional
    public GpsCheckEventResponse checkOut(GpsCheckOutRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Find the open check-in
        List<GpsCheckEvent> openCheckIns = checkEventRepository.findOpenCheckIns(orgId, request.employeeId());
        if (openCheckIns.isEmpty()) {
            throw new IllegalStateException("Нет открытого check-in для данного сотрудника.");
        }

        GpsCheckEvent checkInEvent = openCheckIns.get(0);

        // Find matching geofence for check-out location
        List<SiteGeofence> activeFences = geofenceRepository.findActiveByOrganizationId(orgId);
        boolean withinGeofence = false;
        UUID matchedFenceId = null;

        for (SiteGeofence fence : activeFences) {
            if (isWithinGeofence(request.latitude(), request.longitude(), fence)) {
                withinGeofence = true;
                matchedFenceId = fence.getId();
                break;
            }
        }

        Instant now = Instant.now();

        GpsCheckEvent checkOutEvent = GpsCheckEvent.builder()
                .organizationId(orgId)
                .employeeId(request.employeeId())
                .projectId(checkInEvent.getProjectId())
                .siteGeofenceId(matchedFenceId)
                .eventType(CheckEventType.CHECK_OUT)
                .latitude(request.latitude())
                .longitude(request.longitude())
                .accuracyMeters(request.accuracyMeters())
                .isWithinGeofence(withinGeofence)
                .deviceId(request.deviceId())
                .recordedAt(now)
                .build();

        checkOutEvent = checkEventRepository.save(checkOutEvent);
        auditService.logCreate("GpsCheckEvent", checkOutEvent.getId());

        // Update the timesheet entry with check-out details
        GpsTimesheetEntry entry = entryRepository.findByCheckInEventId(orgId, checkInEvent.getId())
                .orElseThrow(() -> new EntityNotFoundException("Запись табеля не найдена для check-in: " + checkInEvent.getId()));

        entry.setCheckOutEventId(checkOutEvent.getId());
        entry.setCheckOutTime(now);

        // Compute total hours
        long seconds = ChronoUnit.SECONDS.between(entry.getCheckInTime(), now);
        BigDecimal hours = BigDecimal.valueOf(seconds)
                .divide(BigDecimal.valueOf(3600), 2, RoundingMode.HALF_UP);
        entry.setTotalHours(hours);

        // Geofence verified = both check-in and check-out within geofence
        entry.setGeofenceVerified(entry.isGeofenceVerified() && withinGeofence);

        entry = entryRepository.save(entry);
        auditService.logUpdate("GpsTimesheetEntry", entry.getId(), "checkOut", null, now.toString());

        log.info("GPS check-out: employee {} at ({}, {}), total hours: {}, entry: {}",
                request.employeeId(), request.latitude(), request.longitude(),
                hours, entry.getId());

        return GpsCheckEventResponse.fromEntity(checkOutEvent);
    }

    // ───────── Geofence distance calculation ─────────

    /**
     * Haversine formula to check if a point is within a circular geofence.
     */
    public boolean isWithinGeofence(double lat, double lng, SiteGeofence fence) {
        double dLat = Math.toRadians(fence.getCenterLatitude() - lat);
        double dLng = Math.toRadians(fence.getCenterLongitude() - lng);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat)) * Math.cos(Math.toRadians(fence.getCenterLatitude()))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = EARTH_RADIUS_METERS * c;
        return distance <= fence.getRadiusMeters();
    }

    // ───────── Timesheet entries ─────────

    @Transactional(readOnly = true)
    public Page<GpsTimesheetEntryResponse> listEntries(UUID employeeId, UUID projectId,
                                                        LocalDate from, LocalDate to,
                                                        Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        if (employeeId != null && from != null && to != null) {
            return entryRepository.findByEmployeeAndDateRange(orgId, employeeId, from, to, pageable)
                    .map(GpsTimesheetEntryResponse::fromEntity);
        }
        if (projectId != null) {
            return entryRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId, pageable)
                    .map(GpsTimesheetEntryResponse::fromEntity);
        }
        return entryRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(GpsTimesheetEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<GpsTimesheetEntryResponse> listUnverifiedEntries(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return entryRepository.findUnverified(orgId, pageable)
                .map(GpsTimesheetEntryResponse::fromEntity);
    }

    @Transactional
    public GpsTimesheetEntryResponse verifyEntry(UUID entryId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        GpsTimesheetEntry entry = entryRepository.findByIdAndOrganizationIdAndDeletedFalse(entryId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Запись табеля не найдена: " + entryId));

        entry.setVerified(true);
        entry = entryRepository.save(entry);
        auditService.logStatusChange("GpsTimesheetEntry", entry.getId(), "unverified", "verified");

        log.info("GPS timesheet entry verified: {}", entry.getId());
        return GpsTimesheetEntryResponse.fromEntity(entry);
    }

    @Transactional(readOnly = true)
    public List<GpsTimesheetEntryResponse> getEmployeeTimesheet(UUID employeeId, LocalDate from, LocalDate to) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return entryRepository.findByEmployeeAndDateRange(orgId, employeeId, from, to)
                .stream()
                .map(GpsTimesheetEntryResponse::fromEntity)
                .toList();
    }

    // ───────── Monthly summaries ─────────

    @Transactional(readOnly = true)
    public Page<GpsTimesheetSummaryResponse> listSummaries(UUID employeeId, Integer year, Integer month,
                                                            Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        if (employeeId != null) {
            return summaryRepository.findByOrganizationIdAndEmployeeIdAndDeletedFalse(orgId, employeeId, pageable)
                    .map(GpsTimesheetSummaryResponse::fromEntity);
        }
        if (year != null && month != null) {
            return summaryRepository.findByOrgAndPeriod(orgId, year, month, pageable)
                    .map(GpsTimesheetSummaryResponse::fromEntity);
        }
        // Default to current month
        LocalDate now = LocalDate.now();
        return summaryRepository.findByOrgAndPeriod(orgId, now.getYear(), now.getMonthValue(), pageable)
                .map(GpsTimesheetSummaryResponse::fromEntity);
    }

    @Transactional
    public void generateMonthlySummary(int year, int month) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        YearMonth ym = YearMonth.of(year, month);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        List<GpsTimesheetEntry> entries = entryRepository.findByOrgAndPeriod(orgId, from, to);

        // Group by employee
        Set<UUID> employeeIds = new HashSet<>();
        for (GpsTimesheetEntry entry : entries) {
            employeeIds.add(entry.getEmployeeId());
        }

        for (UUID empId : employeeIds) {
            List<GpsTimesheetEntry> empEntries = entries.stream()
                    .filter(e -> e.getEmployeeId().equals(empId))
                    .toList();

            int totalDays = (int) empEntries.stream()
                    .map(GpsTimesheetEntry::getWorkDate)
                    .distinct()
                    .count();

            BigDecimal totalHours = empEntries.stream()
                    .filter(e -> e.getTotalHours() != null)
                    .map(GpsTimesheetEntry::getTotalHours)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal verifiedHours = empEntries.stream()
                    .filter(e -> e.isVerified() && e.getTotalHours() != null)
                    .map(GpsTimesheetEntry::getTotalHours)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            int violations = (int) empEntries.stream()
                    .filter(e -> !e.isGeofenceVerified())
                    .count();

            GpsTimesheetSummary summary = summaryRepository
                    .findByEmployeeAndPeriod(orgId, empId, year, month)
                    .orElseGet(() -> GpsTimesheetSummary.builder()
                            .organizationId(orgId)
                            .employeeId(empId)
                            .periodYear(year)
                            .periodMonth(month)
                            .build());

            summary.setTotalDays(totalDays);
            summary.setTotalHours(totalHours);
            summary.setVerifiedHours(verifiedHours);
            summary.setGeofenceViolations(violations);

            summaryRepository.save(summary);
        }

        log.info("Generated GPS timesheet summaries for {}/{}: {} employees", year, month, employeeIds.size());
    }

    // ───────── Dashboard ─────────

    @Transactional(readOnly = true)
    public TimesheetDashboardResponse getTimesheetDashboard() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        LocalDate today = LocalDate.now();

        long checkedIn = entryRepository.countCheckedInToday(orgId, today);
        long checkedOut = entryRepository.countCheckedOutToday(orgId, today);
        long activeOnSite = entryRepository.countActiveOnSite(orgId, today);

        BigDecimal sumHours = entryRepository.sumHoursForDate(orgId, today);
        BigDecimal avgHours = BigDecimal.ZERO;
        if (checkedOut > 0) {
            avgHours = sumHours.divide(BigDecimal.valueOf(checkedOut), 2, RoundingMode.HALF_UP);
        }

        ZonedDateTime startOfDay = today.atStartOfDay(ZoneId.systemDefault());
        ZonedDateTime endOfDay = today.atTime(LocalTime.MAX).atZone(ZoneId.systemDefault());
        long violations = checkEventRepository.countGeofenceViolations(
                orgId, startOfDay.toInstant(), endOfDay.toInstant());

        return new TimesheetDashboardResponse(
                checkedIn,
                checkedOut,
                activeOnSite,
                avgHours,
                violations
        );
    }

    // ───────── Helpers ─────────

    private SiteGeofence getGeofenceOrThrow(UUID id, UUID orgId) {
        return geofenceRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Геозона не найдена: " + id));
    }
}
