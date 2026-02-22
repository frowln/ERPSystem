package com.privod.platform.modules.esg.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.esg.domain.EsgMaterialCategory;
import com.privod.platform.modules.esg.domain.EsgReport;
import com.privod.platform.modules.esg.domain.EsgReportStatus;
import com.privod.platform.modules.esg.domain.EsgReportType;
import com.privod.platform.modules.esg.domain.MaterialGwpEntry;
import com.privod.platform.modules.esg.domain.ProjectCarbonFootprint;
import com.privod.platform.modules.esg.repository.EsgReportRepository;
import com.privod.platform.modules.esg.repository.MaterialGwpEntryRepository;
import com.privod.platform.modules.esg.repository.ProjectCarbonFootprintRepository;
import com.privod.platform.modules.esg.web.dto.CalculateFootprintRequest;
import com.privod.platform.modules.esg.web.dto.CreateGwpEntryRequest;
import com.privod.platform.modules.esg.web.dto.EsgReportResponse;
import com.privod.platform.modules.esg.web.dto.GenerateEsgReportRequest;
import com.privod.platform.modules.esg.web.dto.MaterialGwpEntryResponse;
import com.privod.platform.modules.esg.web.dto.PortfolioEsgSummaryResponse;
import com.privod.platform.modules.esg.web.dto.ProjectCarbonFootprintResponse;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.MaterialCategory;
import com.privod.platform.modules.warehouse.domain.StockEntry;
import com.privod.platform.modules.warehouse.repository.MaterialRepository;
import com.privod.platform.modules.warehouse.repository.StockEntryRepository;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EsgService {

    private static final BigDecimal DIESEL_CO2_PER_LITER = new BigDecimal("2.68");
    private static final BigDecimal GRID_CO2_PER_KWH = new BigDecimal("0.42");
    private static final BigDecimal BENCHMARK_AVG_PER_SQM = new BigDecimal("450");
    private static final BigDecimal BENCHMARK_BEST_PER_SQM = new BigDecimal("300");
    private static final BigDecimal ONE_MILLION = new BigDecimal("1000000");

    private final MaterialGwpEntryRepository gwpEntryRepository;
    private final ProjectCarbonFootprintRepository footprintRepository;
    private final EsgReportRepository esgReportRepository;
    private final ProjectRepository projectRepository;
    private final MaterialRepository materialRepository;
    private final StockEntryRepository stockEntryRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    // ---- GWP Entry CRUD ----

    @Transactional(readOnly = true)
    public Page<MaterialGwpEntryResponse> listGwpEntries(EsgMaterialCategory category, Pageable pageable) {
        if (category != null) {
            return gwpEntryRepository.findByMaterialCategoryAndDeletedFalse(category, pageable)
                    .map(MaterialGwpEntryResponse::fromEntity);
        }
        return gwpEntryRepository.findByDeletedFalse(pageable)
                .map(MaterialGwpEntryResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public MaterialGwpEntryResponse getGwpEntry(UUID id) {
        MaterialGwpEntry entry = getGwpEntryOrThrow(id);
        return MaterialGwpEntryResponse.fromEntity(entry);
    }

    @Transactional
    public MaterialGwpEntryResponse createGwpEntry(CreateGwpEntryRequest request) {
        MaterialGwpEntry entry = MaterialGwpEntry.builder()
                .materialCategory(request.materialCategory())
                .materialSubcategory(request.materialSubcategory())
                .name(request.name())
                .gwpPerUnit(request.gwpPerUnit())
                .unit(request.unit())
                .source(request.source())
                .country(request.country() != null ? request.country() : "RU")
                .dataYear(request.dataYear())
                .isVerified(false)
                .notes(request.notes())
                .build();

        entry = gwpEntryRepository.save(entry);
        auditService.logCreate("MaterialGwpEntry", entry.getId());

        log.info("GWP entry created: {} ({}) - {} kg CO2e/{}",
                entry.getName(), entry.getMaterialCategory(), entry.getGwpPerUnit(), entry.getUnit());
        return MaterialGwpEntryResponse.fromEntity(entry);
    }

    @Transactional
    public void deleteGwpEntry(UUID id) {
        MaterialGwpEntry entry = getGwpEntryOrThrow(id);
        entry.softDelete();
        gwpEntryRepository.save(entry);
        auditService.logDelete("MaterialGwpEntry", entry.getId());
        log.info("GWP entry deleted: {} ({})", entry.getName(), entry.getId());
    }

    // ---- Carbon Footprint Calculation ----

    @Transactional
    public ProjectCarbonFootprintResponse calculateProjectFootprint(CalculateFootprintRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID projectId = request.projectId();

        Project project = projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));

        // 1. Get stock entries for this project (materials consumed)
        List<StockEntry> stockEntries = stockEntryRepository.findByProjectIdAndOrganizationId(projectId, orgId);

        // 2. Load all GWP entries for matching
        List<MaterialGwpEntry> allGwpEntries = gwpEntryRepository.findAllVerified();

        // 3. Calculate embodied carbon per material
        BigDecimal totalEmbodiedCarbon = BigDecimal.ZERO;
        List<Map<String, Object>> materialBreakdown = new ArrayList<>();

        for (StockEntry stockEntry : stockEntries) {
            if (stockEntry.getQuantity() == null || stockEntry.getQuantity().compareTo(BigDecimal.ZERO) == 0) {
                continue;
            }

            // Load material details
            Optional<Material> materialOpt = materialRepository.findByIdAndOrganizationIdAndDeletedFalse(
                    stockEntry.getMaterialId(), orgId);
            if (materialOpt.isEmpty()) {
                continue;
            }

            Material material = materialOpt.get();
            EsgMaterialCategory esgCategory = mapWarehouseCategoryToEsg(material.getCategory());
            if (esgCategory == null) {
                continue;
            }

            // Find best matching GWP factor
            Optional<MaterialGwpEntry> gwpMatch = findBestGwpMatch(allGwpEntries, esgCategory, material.getName());
            if (gwpMatch.isEmpty()) {
                continue;
            }

            MaterialGwpEntry gwp = gwpMatch.get();
            BigDecimal co2e = stockEntry.getQuantity().multiply(gwp.getGwpPerUnit())
                    .setScale(2, RoundingMode.HALF_UP);

            totalEmbodiedCarbon = totalEmbodiedCarbon.add(co2e);

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("materialCategory", esgCategory.name());
            item.put("materialName", material.getName());
            item.put("quantity", stockEntry.getQuantity());
            item.put("unit", gwp.getUnit());
            item.put("gwpPerUnit", gwp.getGwpPerUnit());
            item.put("totalCo2e", co2e);
            materialBreakdown.add(item);
        }

        // 4. Default energy estimate (simplified)
        BigDecimal totalEnergyKwh = BigDecimal.ZERO;
        BigDecimal energyCo2 = BigDecimal.ZERO;
        List<Map<String, Object>> energyBreakdown = new ArrayList<>();

        // Estimate: 50 kWh per m2 of built area from grid if builtArea is provided
        BigDecimal builtAreaSqm = request.builtAreaSqm();
        if (builtAreaSqm != null && builtAreaSqm.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal gridKwh = builtAreaSqm.multiply(new BigDecimal("50"));
            BigDecimal gridCo2 = gridKwh.multiply(GRID_CO2_PER_KWH).setScale(2, RoundingMode.HALF_UP);
            totalEnergyKwh = totalEnergyKwh.add(gridKwh);
            energyCo2 = energyCo2.add(gridCo2);

            Map<String, Object> gridEntry = new LinkedHashMap<>();
            gridEntry.put("source", "grid");
            gridEntry.put("kwh", gridKwh);
            gridEntry.put("co2e", gridCo2);
            energyBreakdown.add(gridEntry);
        }

        // 5. Total carbon footprint
        BigDecimal totalCarbonFootprint = totalEmbodiedCarbon.add(energyCo2);

        // 6. Carbon per sqm
        BigDecimal carbonPerSqm = null;
        if (builtAreaSqm != null && builtAreaSqm.compareTo(BigDecimal.ZERO) > 0) {
            carbonPerSqm = totalCarbonFootprint.divide(builtAreaSqm, 2, RoundingMode.HALF_UP);
        }

        // 7. Build and save footprint snapshot
        ProjectCarbonFootprint footprint = ProjectCarbonFootprint.builder()
                .organizationId(orgId)
                .projectId(projectId)
                .totalEmbodiedCarbon(totalEmbodiedCarbon)
                .materialBreakdownJson(toJson(materialBreakdown))
                .totalEnergyKwh(totalEnergyKwh)
                .energySourceBreakdownJson(toJson(energyBreakdown))
                .totalWasteTons(BigDecimal.ZERO)
                .wasteDivertedTons(BigDecimal.ZERO)
                .wasteDiversionRate(BigDecimal.ZERO)
                .totalWaterM3(BigDecimal.ZERO)
                .totalCarbonFootprint(totalCarbonFootprint)
                .carbonPerSqm(carbonPerSqm)
                .builtAreaSqm(builtAreaSqm)
                .calculatedAt(Instant.now())
                .periodFrom(request.periodFrom())
                .periodTo(request.periodTo())
                .build();

        footprint = footprintRepository.save(footprint);
        auditService.logCreate("ProjectCarbonFootprint", footprint.getId());

        log.info("Carbon footprint calculated for project {}: {} kg CO2e (embodied: {}, energy: {})",
                projectId, totalCarbonFootprint, totalEmbodiedCarbon, energyCo2);

        return ProjectCarbonFootprintResponse.fromEntity(footprint);
    }

    @Transactional(readOnly = true)
    public ProjectCarbonFootprintResponse getProjectFootprint(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        ProjectCarbonFootprint footprint = footprintRepository
                .findLatestByProjectIdAndOrganizationId(projectId, orgId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Углеродный след проекта не найден: " + projectId));
        return ProjectCarbonFootprintResponse.fromEntity(footprint);
    }

    @Transactional(readOnly = true)
    public Page<ProjectCarbonFootprintResponse> listProjectFootprints(UUID projectId, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return footprintRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(ProjectCarbonFootprintResponse::fromEntity);
    }

    // ---- ESG Report Generation ----

    @Transactional
    public EsgReportResponse generateEsgReport(GenerateEsgReportRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID projectId = request.projectId();

        Project project = projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));

        // Calculate/refresh footprint
        CalculateFootprintRequest calcRequest = new CalculateFootprintRequest(
                projectId, null, null, request.builtAreaSqm());
        ProjectCarbonFootprintResponse footprint = calculateProjectFootprint(calcRequest);

        // Carbon intensity: total carbon / (budget / 1,000,000)
        BigDecimal carbonIntensity = null;
        if (project.getBudgetAmount() != null && project.getBudgetAmount().compareTo(BigDecimal.ZERO) > 0) {
            carbonIntensity = footprint.totalCarbonFootprint()
                    .divide(project.getBudgetAmount().divide(ONE_MILLION, 6, RoundingMode.HALF_UP),
                            2, RoundingMode.HALF_UP);
        }

        // Compare against benchmarks
        Map<String, Object> benchmarks = new LinkedHashMap<>();
        benchmarks.put("industry_avg_per_sqm", BENCHMARK_AVG_PER_SQM);
        benchmarks.put("best_practice_per_sqm", BENCHMARK_BEST_PER_SQM);
        if (footprint.carbonPerSqm() != null) {
            benchmarks.put("project_per_sqm", footprint.carbonPerSqm());
            benchmarks.put("vs_avg_pct", footprint.carbonPerSqm()
                    .divide(BENCHMARK_AVG_PER_SQM, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")).setScale(1, RoundingMode.HALF_UP));
        }

        // Check carbon target
        Boolean targetMet = null;
        BigDecimal carbonTarget = request.carbonTarget();
        if (carbonTarget != null && carbonTarget.compareTo(BigDecimal.ZERO) > 0) {
            targetMet = footprint.totalCarbonFootprint().compareTo(carbonTarget) <= 0;
        }

        // Build full report data
        Map<String, Object> reportData = new LinkedHashMap<>();
        reportData.put("projectId", projectId.toString());
        reportData.put("projectName", project.getName());
        reportData.put("projectCode", project.getCode());
        reportData.put("totalEmbodiedCarbon", footprint.totalEmbodiedCarbon());
        reportData.put("totalEnergyKwh", footprint.totalEnergyKwh());
        reportData.put("totalCarbonFootprint", footprint.totalCarbonFootprint());
        reportData.put("carbonPerSqm", footprint.carbonPerSqm());
        reportData.put("carbonIntensity", carbonIntensity);
        reportData.put("materialBreakdown", footprint.materialBreakdownJson());
        reportData.put("energyBreakdown", footprint.energySourceBreakdownJson());
        reportData.put("benchmarks", benchmarks);

        String title = "ESG отчёт: " + project.getName();
        if (request.period() != null) {
            title += " (" + request.period() + ")";
        }

        EsgReport report = EsgReport.builder()
                .organizationId(orgId)
                .projectId(projectId)
                .reportType(EsgReportType.PROJECT)
                .reportPeriod(request.period())
                .status(EsgReportStatus.GENERATED)
                .title(title)
                .totalCarbon(footprint.totalCarbonFootprint())
                .totalEnergy(footprint.totalEnergyKwh())
                .totalWaste(footprint.totalWasteTons())
                .totalWater(footprint.totalWaterM3())
                .wasteDiversionRate(footprint.wasteDiversionRate())
                .carbonIntensity(carbonIntensity)
                .dataJson(toJson(reportData))
                .carbonTarget(carbonTarget)
                .carbonTargetMet(targetMet)
                .benchmarkJson(toJson(benchmarks))
                .generatedAt(Instant.now())
                .notes(request.notes())
                .build();

        report = esgReportRepository.save(report);
        auditService.logCreate("EsgReport", report.getId());

        log.info("ESG report generated for project {}: {} kg CO2e, intensity: {}",
                projectId, footprint.totalCarbonFootprint(), carbonIntensity);

        return EsgReportResponse.fromEntity(report);
    }

    @Transactional(readOnly = true)
    public EsgReportResponse getEsgReport(UUID reportId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        EsgReport report = esgReportRepository.findByIdAndOrganizationIdAndDeletedFalse(reportId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("ESG отчёт не найден: " + reportId));
        return EsgReportResponse.fromEntity(report);
    }

    @Transactional(readOnly = true)
    public Page<EsgReportResponse> listEsgReports(EsgReportType reportType, EsgReportStatus status, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (reportType != null) {
            return esgReportRepository.findByOrganizationIdAndReportTypeAndDeletedFalse(orgId, reportType, pageable)
                    .map(EsgReportResponse::fromEntity);
        }
        if (status != null) {
            return esgReportRepository.findByOrganizationIdAndStatusAndDeletedFalse(orgId, status, pageable)
                    .map(EsgReportResponse::fromEntity);
        }
        return esgReportRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(EsgReportResponse::fromEntity);
    }

    @Transactional
    public EsgReportResponse approveReport(UUID reportId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        EsgReport report = esgReportRepository.findByIdAndOrganizationIdAndDeletedFalse(reportId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("ESG отчёт не найден: " + reportId));

        String oldStatus = report.getStatus().name();
        report.setStatus(EsgReportStatus.APPROVED);
        report.setApprovedBy(userId);
        report.setApprovedAt(Instant.now());

        report = esgReportRepository.save(report);
        auditService.logStatusChange("EsgReport", report.getId(), oldStatus, EsgReportStatus.APPROVED.name());

        log.info("ESG report approved: {} by user {}", reportId, userId);
        return EsgReportResponse.fromEntity(report);
    }

    @Transactional
    public void deleteEsgReport(UUID reportId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        EsgReport report = esgReportRepository.findByIdAndOrganizationIdAndDeletedFalse(reportId, orgId)
                .orElseThrow(() -> new EntityNotFoundException("ESG отчёт не найден: " + reportId));
        report.softDelete();
        esgReportRepository.save(report);
        auditService.logDelete("EsgReport", report.getId());
        log.info("ESG report deleted: {}", reportId);
    }

    // ---- Portfolio Summary ----

    @Transactional(readOnly = true)
    public PortfolioEsgSummaryResponse getPortfolioSummary() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        List<UUID> projectIds = projectRepository.findActiveProjectIdsByOrganizationId(orgId);
        if (projectIds.isEmpty()) {
            return new PortfolioEsgSummaryResponse(
                    0, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO,
                    BigDecimal.ZERO, BigDecimal.ZERO, List.of());
        }

        // Get latest footprint per project
        List<ProjectCarbonFootprint> allFootprints = footprintRepository
                .findLatestByOrganizationIdAndProjectIds(orgId, projectIds);

        // De-duplicate: keep only the latest per project
        Map<UUID, ProjectCarbonFootprint> latestPerProject = new LinkedHashMap<>();
        for (ProjectCarbonFootprint fp : allFootprints) {
            latestPerProject.putIfAbsent(fp.getProjectId(), fp);
        }

        List<ProjectCarbonFootprint> footprints = new ArrayList<>(latestPerProject.values());

        BigDecimal totalCarbon = BigDecimal.ZERO;
        BigDecimal totalEnergy = BigDecimal.ZERO;
        BigDecimal totalWaste = BigDecimal.ZERO;
        BigDecimal totalWater = BigDecimal.ZERO;
        BigDecimal totalCarbonPerSqm = BigDecimal.ZERO;
        BigDecimal totalWasteDiversion = BigDecimal.ZERO;
        int sqmCount = 0;
        int diversionCount = 0;

        for (ProjectCarbonFootprint fp : footprints) {
            totalCarbon = totalCarbon.add(fp.getTotalCarbonFootprint() != null ? fp.getTotalCarbonFootprint() : BigDecimal.ZERO);
            totalEnergy = totalEnergy.add(fp.getTotalEnergyKwh() != null ? fp.getTotalEnergyKwh() : BigDecimal.ZERO);
            totalWaste = totalWaste.add(fp.getTotalWasteTons() != null ? fp.getTotalWasteTons() : BigDecimal.ZERO);
            totalWater = totalWater.add(fp.getTotalWaterM3() != null ? fp.getTotalWaterM3() : BigDecimal.ZERO);

            if (fp.getCarbonPerSqm() != null) {
                totalCarbonPerSqm = totalCarbonPerSqm.add(fp.getCarbonPerSqm());
                sqmCount++;
            }
            if (fp.getWasteDiversionRate() != null && fp.getWasteDiversionRate().compareTo(BigDecimal.ZERO) > 0) {
                totalWasteDiversion = totalWasteDiversion.add(fp.getWasteDiversionRate());
                diversionCount++;
            }
        }

        BigDecimal avgCarbonPerSqm = sqmCount > 0
                ? totalCarbonPerSqm.divide(BigDecimal.valueOf(sqmCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
        BigDecimal avgWasteDiversion = diversionCount > 0
                ? totalWasteDiversion.divide(BigDecimal.valueOf(diversionCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<ProjectCarbonFootprintResponse> fpResponses = footprints.stream()
                .map(ProjectCarbonFootprintResponse::fromEntity)
                .toList();

        return new PortfolioEsgSummaryResponse(
                footprints.size(),
                totalCarbon,
                totalEnergy,
                totalWaste,
                totalWater,
                avgCarbonPerSqm,
                avgWasteDiversion,
                fpResponses
        );
    }

    // ---- Helpers ----

    private MaterialGwpEntry getGwpEntryOrThrow(UUID id) {
        return gwpEntryRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("GWP запись не найдена: " + id));
    }

    /**
     * Map warehouse MaterialCategory to ESG EsgMaterialCategory.
     */
    private EsgMaterialCategory mapWarehouseCategoryToEsg(MaterialCategory warehouseCategory) {
        if (warehouseCategory == null) {
            return null;
        }
        return switch (warehouseCategory) {
            case CONCRETE -> EsgMaterialCategory.CONCRETE;
            case METAL -> EsgMaterialCategory.STEEL;
            case WOOD -> EsgMaterialCategory.TIMBER;
            case INSULATION -> EsgMaterialCategory.INSULATION;
            case PIPES -> EsgMaterialCategory.PIPE;
            case ELECTRICAL -> EsgMaterialCategory.COPPER;
            case FINISHING -> EsgMaterialCategory.CERAMIC;
            case FASTENERS -> EsgMaterialCategory.STEEL;
            case TOOLS, OTHER -> null;
        };
    }

    /**
     * Find the best matching GWP entry for a material by category and name similarity.
     */
    private Optional<MaterialGwpEntry> findBestGwpMatch(List<MaterialGwpEntry> allEntries,
                                                         EsgMaterialCategory category,
                                                         String materialName) {
        if (materialName == null) {
            materialName = "";
        }
        String lowerName = materialName.toLowerCase();

        // First: exact category + name contains
        for (MaterialGwpEntry entry : allEntries) {
            if (entry.getMaterialCategory() == category
                    && lowerName.contains(entry.getName().toLowerCase())) {
                return Optional.of(entry);
            }
        }

        // Second: exact category + GWP entry name contains material name
        for (MaterialGwpEntry entry : allEntries) {
            if (entry.getMaterialCategory() == category
                    && entry.getName().toLowerCase().contains(lowerName)) {
                return Optional.of(entry);
            }
        }

        // Third: first entry in same category
        for (MaterialGwpEntry entry : allEntries) {
            if (entry.getMaterialCategory() == category) {
                return Optional.of(entry);
            }
        }

        return Optional.empty();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize to JSON", e);
            return "{}";
        }
    }
}
