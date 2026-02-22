package com.privod.platform.modules.iot.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.iot.domain.GeofenceAlert;
import com.privod.platform.modules.iot.domain.GeofenceAlertType;
import com.privod.platform.modules.iot.domain.GeofenceZone;
import com.privod.platform.modules.iot.domain.IotEquipmentDevice;
import com.privod.platform.modules.iot.domain.IotTelemetryPoint;
import com.privod.platform.modules.iot.repository.GeofenceAlertRepository;
import com.privod.platform.modules.iot.repository.GeofenceZoneRepository;
import com.privod.platform.modules.iot.repository.IotEquipmentDeviceRepository;
import com.privod.platform.modules.iot.repository.IotTelemetryPointRepository;
import com.privod.platform.modules.iot.web.dto.CreateGeofenceZoneRequest;
import com.privod.platform.modules.iot.web.dto.CreateIotDeviceRequest;
import com.privod.platform.modules.iot.web.dto.GeofenceAlertResponse;
import com.privod.platform.modules.iot.web.dto.GeofenceZoneResponse;
import com.privod.platform.modules.iot.web.dto.IngestTelemetryRequest;
import com.privod.platform.modules.iot.web.dto.IotDashboardResponse;
import com.privod.platform.modules.iot.web.dto.IotEquipmentDeviceResponse;
import com.privod.platform.modules.iot.web.dto.IotTelemetryPointResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class IotService {

    private static final double EARTH_RADIUS_METERS = 6_371_000.0;

    private final IotEquipmentDeviceRepository deviceRepository;
    private final IotTelemetryPointRepository telemetryRepository;
    private final GeofenceZoneRepository zoneRepository;
    private final GeofenceAlertRepository alertRepository;
    private final AuditService auditService;

    // ---- Devices ----

    @Transactional(readOnly = true)
    public Page<IotEquipmentDeviceResponse> listDevices(String search, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (search != null && !search.isBlank()) {
            return deviceRepository.searchByOrganizationId(search.trim(), orgId, pageable)
                    .map(IotEquipmentDeviceResponse::fromEntity);
        }
        return deviceRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(IotEquipmentDeviceResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public IotEquipmentDeviceResponse getDevice(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        IotEquipmentDevice device = getDeviceOrThrow(id, orgId);
        return IotEquipmentDeviceResponse.fromEntity(device);
    }

    @Transactional
    public IotEquipmentDeviceResponse createDevice(CreateIotDeviceRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        IotEquipmentDevice device = IotEquipmentDevice.builder()
                .organizationId(orgId)
                .deviceSerial(request.deviceSerial())
                .deviceType(request.deviceType())
                .equipmentId(request.equipmentId())
                .name(request.name())
                .manufacturer(request.manufacturer())
                .model(request.model())
                .firmwareVersion(request.firmwareVersion())
                .active(true)
                .build();

        device = deviceRepository.save(device);
        auditService.logCreate("IotDevice", device.getId());

        log.info("IoT equipment device created: {} - {} ({})", device.getDeviceSerial(),
                device.getName(), device.getId());
        return IotEquipmentDeviceResponse.fromEntity(device);
    }

    @Transactional
    public IotEquipmentDeviceResponse updateDevice(UUID id, CreateIotDeviceRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        IotEquipmentDevice device = getDeviceOrThrow(id, orgId);

        if (request.deviceSerial() != null) device.setDeviceSerial(request.deviceSerial());
        if (request.deviceType() != null) device.setDeviceType(request.deviceType());
        if (request.equipmentId() != null) device.setEquipmentId(request.equipmentId());
        if (request.name() != null) device.setName(request.name());
        if (request.manufacturer() != null) device.setManufacturer(request.manufacturer());
        if (request.model() != null) device.setModel(request.model());
        if (request.firmwareVersion() != null) device.setFirmwareVersion(request.firmwareVersion());

        device = deviceRepository.save(device);
        auditService.logUpdate("IotDevice", device.getId(), "multiple", null, null);

        log.info("IoT equipment device updated: {} ({})", device.getDeviceSerial(), device.getId());
        return IotEquipmentDeviceResponse.fromEntity(device);
    }

    @Transactional
    public void deleteDevice(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        IotEquipmentDevice device = getDeviceOrThrow(id, orgId);

        device.softDelete();
        deviceRepository.save(device);
        auditService.logDelete("IotDevice", device.getId());

        log.info("IoT equipment device soft-deleted: {} ({})", device.getDeviceSerial(), device.getId());
    }

    // ---- Telemetry ----

    @Transactional
    public List<IotTelemetryPointResponse> ingestTelemetry(List<IngestTelemetryRequest> requests) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        List<IotTelemetryPointResponse> results = new ArrayList<>();

        for (IngestTelemetryRequest request : requests) {
            IotEquipmentDevice device = getDeviceOrThrow(request.deviceId(), orgId);

            IotTelemetryPoint point = IotTelemetryPoint.builder()
                    .organizationId(orgId)
                    .deviceId(device.getId())
                    .recordedAt(request.recordedAt() != null ? request.recordedAt() : Instant.now())
                    .latitude(request.latitude())
                    .longitude(request.longitude())
                    .altitude(request.altitude())
                    .speed(request.speed())
                    .heading(request.heading())
                    .engineHours(request.engineHours())
                    .fuelLevelPercent(request.fuelLevelPercent())
                    .fuelConsumedLiters(request.fuelConsumedLiters())
                    .temperature(request.temperature())
                    .batteryLevel(request.batteryLevel())
                    .rawPayloadJson(request.rawPayloadJson())
                    .build();

            point = telemetryRepository.save(point);

            // Update device last seen
            device.setLastSeenAt(point.getRecordedAt());
            if (!device.isActive()) {
                device.setActive(true);
            }
            deviceRepository.save(device);

            // Check geofence violations
            checkGeofenceViolations(point, device);

            results.add(IotTelemetryPointResponse.fromEntity(point));
        }

        log.debug("Ingested {} telemetry points for org {}", results.size(), orgId);
        return results;
    }

    @Transactional(readOnly = true)
    public IotTelemetryPointResponse getDeviceCurrentLocation(UUID deviceId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        getDeviceOrThrow(deviceId, orgId);

        IotTelemetryPoint point = telemetryRepository.findLatestByDeviceId(deviceId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Данные телеметрии для устройства не найдены: " + deviceId));
        return IotTelemetryPointResponse.fromEntity(point);
    }

    @Transactional(readOnly = true)
    public Page<IotTelemetryPointResponse> getDeviceTelemetry(UUID deviceId,
                                                               Instant from,
                                                               Instant to,
                                                               Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        getDeviceOrThrow(deviceId, orgId);

        if (from != null && to != null) {
            return telemetryRepository.findByDeviceIdAndRecordedAtBetweenAndDeletedFalse(
                    deviceId, from, to, pageable).map(IotTelemetryPointResponse::fromEntity);
        }
        return telemetryRepository.findByDeviceIdAndDeletedFalse(deviceId, pageable)
                .map(IotTelemetryPointResponse::fromEntity);
    }

    // ---- Geofence Zones ----

    @Transactional(readOnly = true)
    public Page<GeofenceZoneResponse> listZones(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return zoneRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(GeofenceZoneResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public GeofenceZoneResponse getZone(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        GeofenceZone zone = getZoneOrThrow(id, orgId);
        return GeofenceZoneResponse.fromEntity(zone);
    }

    @Transactional
    public GeofenceZoneResponse createZone(CreateGeofenceZoneRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        GeofenceZone zone = GeofenceZone.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .name(request.name())
                .zoneType(request.zoneType())
                .polygonJson(request.polygonJson())
                .radiusMeters(request.radiusMeters())
                .centerLat(request.centerLat())
                .centerLng(request.centerLng())
                .active(true)
                .build();

        zone = zoneRepository.save(zone);
        auditService.logCreate("GeofenceZone", zone.getId());

        log.info("Geofence zone created: {} ({})", zone.getName(), zone.getId());
        return GeofenceZoneResponse.fromEntity(zone);
    }

    @Transactional
    public GeofenceZoneResponse updateZone(UUID id, CreateGeofenceZoneRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        GeofenceZone zone = getZoneOrThrow(id, orgId);

        if (request.name() != null) zone.setName(request.name());
        if (request.zoneType() != null) zone.setZoneType(request.zoneType());
        if (request.projectId() != null) zone.setProjectId(request.projectId());
        if (request.polygonJson() != null) zone.setPolygonJson(request.polygonJson());
        if (request.radiusMeters() != null) zone.setRadiusMeters(request.radiusMeters());
        if (request.centerLat() != null) zone.setCenterLat(request.centerLat());
        if (request.centerLng() != null) zone.setCenterLng(request.centerLng());

        zone = zoneRepository.save(zone);
        auditService.logUpdate("GeofenceZone", zone.getId(), "multiple", null, null);

        log.info("Geofence zone updated: {} ({})", zone.getName(), zone.getId());
        return GeofenceZoneResponse.fromEntity(zone);
    }

    @Transactional
    public void deleteZone(UUID id) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        GeofenceZone zone = getZoneOrThrow(id, orgId);

        zone.softDelete();
        zoneRepository.save(zone);
        auditService.logDelete("GeofenceZone", zone.getId());

        log.info("Geofence zone soft-deleted: {} ({})", zone.getName(), zone.getId());
    }

    // ---- Alerts ----

    @Transactional(readOnly = true)
    public Page<GeofenceAlertResponse> listAlerts(UUID deviceId, GeofenceAlertType alertType,
                                                   Boolean unacknowledgedOnly, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        if (Boolean.TRUE.equals(unacknowledgedOnly)) {
            return alertRepository.findByOrganizationIdAndAcknowledgedFalseAndDeletedFalse(orgId, pageable)
                    .map(GeofenceAlertResponse::fromEntity);
        }
        if (deviceId != null) {
            return alertRepository.findByOrganizationIdAndDeviceIdAndDeletedFalse(orgId, deviceId, pageable)
                    .map(GeofenceAlertResponse::fromEntity);
        }
        if (alertType != null) {
            return alertRepository.findByOrganizationIdAndAlertTypeAndDeletedFalse(orgId, alertType, pageable)
                    .map(GeofenceAlertResponse::fromEntity);
        }
        return alertRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(GeofenceAlertResponse::fromEntity);
    }

    @Transactional
    public GeofenceAlertResponse acknowledgeAlert(UUID alertId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        GeofenceAlert alert = alertRepository.findByIdAndOrganizationIdAndDeletedFalse(alertId, orgId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Оповещение геозоны не найдено: " + alertId));

        if (alert.isAcknowledged()) {
            throw new IllegalStateException("Оповещение уже подтверждено");
        }

        alert.setAcknowledged(true);
        alert.setAcknowledgedBy(userId);
        alert.setAcknowledgedAt(Instant.now());

        alert = alertRepository.save(alert);
        auditService.logStatusChange("GeofenceAlert", alertId, "UNACKNOWLEDGED", "ACKNOWLEDGED");

        log.info("Geofence alert acknowledged: {} by user {}", alertId, userId);
        return GeofenceAlertResponse.fromEntity(alert);
    }

    // ---- Dashboard ----

    @Transactional(readOnly = true)
    public IotDashboardResponse getDashboard() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        long totalDevices = deviceRepository.countByOrganizationIdAndDeletedFalse(orgId);
        long activeDevices = deviceRepository.countByOrganizationIdAndActiveTrueAndDeletedFalse(orgId);
        long totalAlerts = alertRepository.countByOrganizationIdAndDeletedFalse(orgId);
        long unacknowledgedAlerts = alertRepository.countByOrganizationIdAndAcknowledgedFalseAndDeletedFalse(orgId);

        Double avgFuelLevel = telemetryRepository.findAvgFuelLevelByOrganizationId(orgId).orElse(null);
        Double totalEngineHours = telemetryRepository.findTotalEngineHoursByOrganizationId(orgId);

        return new IotDashboardResponse(
                totalDevices,
                activeDevices,
                totalAlerts,
                unacknowledgedAlerts,
                avgFuelLevel,
                totalEngineHours
        );
    }

    // ---- Geofence Violation Check ----

    void checkGeofenceViolations(IotTelemetryPoint point, IotEquipmentDevice device) {
        if (point.getLatitude() == null || point.getLongitude() == null) {
            return;
        }

        UUID orgId = device.getOrganizationId();
        List<GeofenceZone> activeZones = zoneRepository.findByOrganizationIdAndActiveTrueAndDeletedFalse(orgId);

        for (GeofenceZone zone : activeZones) {
            boolean insideZone = isPointInsideZone(point.getLatitude(), point.getLongitude(), zone);

            if (!insideZone && zone.getZoneType() != com.privod.platform.modules.iot.domain.GeofenceZoneType.RESTRICTED) {
                // Device exited a non-restricted zone
                createGeofenceAlert(orgId, device.getId(), zone.getId(),
                        GeofenceAlertType.EXITED, point);
            } else if (insideZone && zone.getZoneType() == com.privod.platform.modules.iot.domain.GeofenceZoneType.RESTRICTED) {
                // Device entered a restricted zone
                createGeofenceAlert(orgId, device.getId(), zone.getId(),
                        GeofenceAlertType.ENTERED, point);
            }
        }
    }

    boolean isPointInsideZone(double lat, double lng, GeofenceZone zone) {
        // Circular zone check (Haversine distance)
        if (zone.getCenterLat() != null && zone.getCenterLng() != null && zone.getRadiusMeters() != null) {
            double distance = haversineDistance(lat, lng, zone.getCenterLat(), zone.getCenterLng());
            return distance <= zone.getRadiusMeters();
        }

        // Polygon zone check (ray casting algorithm)
        if (zone.getPolygonJson() != null && !zone.getPolygonJson().isBlank()) {
            return isPointInPolygon(lat, lng, zone.getPolygonJson());
        }

        return false;
    }

    /**
     * Haversine formula to calculate distance between two lat/lng points in meters.
     */
    double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_METERS * c;
    }

    /**
     * Ray casting algorithm for point-in-polygon test.
     * Expects polygonJson in simplified format: [[lng1,lat1],[lng2,lat2],...]
     */
    boolean isPointInPolygon(double lat, double lng, String polygonJson) {
        try {
            // Parse simple coordinate array: [[lng,lat],[lng,lat],...]
            String cleaned = polygonJson.trim();
            if (cleaned.startsWith("{")) {
                // GeoJSON format - extract coordinates from the first ring
                int coordIdx = cleaned.indexOf("\"coordinates\"");
                if (coordIdx < 0) return false;
                int bracketStart = cleaned.indexOf("[[[", coordIdx);
                if (bracketStart < 0) return false;
                int bracketEnd = cleaned.indexOf("]]]", bracketStart);
                if (bracketEnd < 0) return false;
                cleaned = cleaned.substring(bracketStart + 1, bracketEnd + 2); // gets [[lng,lat],...]
            }

            // Remove outer brackets
            if (cleaned.startsWith("[[")) {
                cleaned = cleaned.substring(1, cleaned.length() - 1);
            }

            String[] pairs = cleaned.split("\\],\\[");
            double[][] polygon = new double[pairs.length][2];

            for (int i = 0; i < pairs.length; i++) {
                String pair = pairs[i].replace("[", "").replace("]", "").trim();
                String[] coords = pair.split(",");
                polygon[i][0] = Double.parseDouble(coords[0].trim()); // lng
                polygon[i][1] = Double.parseDouble(coords[1].trim()); // lat
            }

            // Ray casting
            boolean inside = false;
            int n = polygon.length;
            for (int i = 0, j = n - 1; i < n; j = i++) {
                double yi = polygon[i][1]; // lat
                double xi = polygon[i][0]; // lng
                double yj = polygon[j][1];
                double xj = polygon[j][0];

                if (((yi > lat) != (yj > lat))
                        && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
                    inside = !inside;
                }
            }
            return inside;
        } catch (Exception e) {
            log.warn("Failed to parse polygon JSON for geofence check: {}", e.getMessage());
            return false;
        }
    }

    private void createGeofenceAlert(UUID orgId, UUID deviceId, UUID zoneId,
                                     GeofenceAlertType alertType, IotTelemetryPoint point) {
        GeofenceAlert alert = GeofenceAlert.builder()
                .organizationId(orgId)
                .deviceId(deviceId)
                .zoneId(zoneId)
                .alertType(alertType)
                .triggeredAt(point.getRecordedAt())
                .latitude(point.getLatitude())
                .longitude(point.getLongitude())
                .acknowledged(false)
                .build();

        alert = alertRepository.save(alert);
        auditService.logCreate("GeofenceAlert", alert.getId());

        log.warn("Geofence alert created: type={}, device={}, zone={}", alertType, deviceId, zoneId);
    }

    // ---- Private helpers ----

    private IotEquipmentDevice getDeviceOrThrow(UUID id, UUID orgId) {
        return deviceRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "IoT устройство не найдено: " + id));
    }

    private GeofenceZone getZoneOrThrow(UUID id, UUID orgId) {
        return zoneRepository.findByIdAndOrganizationIdAndDeletedFalse(id, orgId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Геозона не найдена: " + id));
    }
}
