package com.privod.platform.modules.estimate.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.estimate.domain.ExportHistory;
import com.privod.platform.modules.estimate.domain.ImportHistory;
import com.privod.platform.modules.estimate.domain.VolumeCalculation;
import com.privod.platform.modules.estimate.repository.ExportHistoryRepository;
import com.privod.platform.modules.estimate.repository.ImportHistoryRepository;
import com.privod.platform.modules.estimate.repository.VolumeCalculationRepository;
import com.privod.platform.modules.estimate.web.dto.EstimateComparisonResponse;
import com.privod.platform.modules.estimate.web.dto.ExportConfigRequest;
import com.privod.platform.modules.estimate.web.dto.ExportHistoryResponse;
import com.privod.platform.modules.estimate.web.dto.ExportValidationResponse;
import com.privod.platform.modules.estimate.web.dto.ImportHistoryResponse;
import com.privod.platform.modules.estimate.web.dto.ImportLsrRequest;
import com.privod.platform.modules.estimate.web.dto.ImportLsrResponse;
import com.privod.platform.modules.estimate.web.dto.NormativeRateSearchResponse;
import com.privod.platform.modules.estimate.web.dto.VolumeCalculateRequest;
import com.privod.platform.modules.estimate.web.dto.VolumeCalculationResponse;
import com.privod.platform.modules.estimate.web.dto.VolumeSaveRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EstimateAdvancedService {

    private final ImportHistoryRepository importHistoryRepository;
    private final ExportHistoryRepository exportHistoryRepository;
    private final VolumeCalculationRepository volumeCalculationRepository;
    private final ObjectMapper objectMapper;

    // === Import (GRAND-Smeta formats) ===

    @Transactional
    public ImportHistoryResponse importEstimate(MultipartFile file, String format) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";

        // Stub: record the import attempt with placeholder data
        ImportHistory history = ImportHistory.builder()
                .organizationId(organizationId)
                .fileName(fileName)
                .format(format)
                .importDate(Instant.now())
                .status("success")
                .itemsImported(0)
                .build();

        history = importHistoryRepository.save(history);

        log.info("Estimate import initiated: file={}, format={} ({})", fileName, format, history.getId());
        return ImportHistoryResponse.fromEntity(history);
    }

    @Transactional(readOnly = true)
    public List<ImportHistoryResponse> getImportHistory() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        return importHistoryRepository
                .findByOrganizationIdAndDeletedFalseOrderByImportDateDesc(organizationId)
                .stream()
                .map(ImportHistoryResponse::fromEntity)
                .toList();
    }

    // === Export for GGE ===

    @Transactional(readOnly = true)
    public ExportValidationResponse validateForExport(UUID estimateId) {
        // Stub: return valid with no errors
        log.info("Validating estimate for GGE export: {}", estimateId);

        return new ExportValidationResponse(
                true,
                List.of(),
                List.of(new ExportValidationResponse.ValidationIssue(
                        "notes", "Рекомендуется заполнить примечания перед экспортом"))
        );
    }

    @Transactional
    public byte[] exportEstimate(UUID estimateId, ExportConfigRequest config) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        // Record export in history
        ExportHistory history = ExportHistory.builder()
                .organizationId(organizationId)
                .estimateId(estimateId)
                .estimateName("Смета")
                .exportDate(Instant.now())
                .format("GGE " + (config.formatVersion() != null ? config.formatVersion() : "2.0"))
                .status("success")
                .build();

        exportHistoryRepository.save(history);

        log.info("Estimate exported for GGE: {} ({})", estimateId, history.getId());

        // Stub: return empty XML bytes as placeholder
        String stubXml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<estimate><id>"
                + estimateId + "</id><status>exported</status></estimate>";
        return stubXml.getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    @Transactional(readOnly = true)
    public List<ExportHistoryResponse> getExportHistory() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        return exportHistoryRepository
                .findByOrganizationIdAndDeletedFalseOrderByExportDateDesc(organizationId)
                .stream()
                .map(ExportHistoryResponse::fromEntity)
                .toList();
    }

    // === Volume Calculator ===

    public VolumeCalculationResponse calculateVolume(VolumeCalculateRequest request) {
        String workType = request.workType();
        Map<String, Double> params = request.params() != null ? request.params() : Map.of();

        double result = calculateVolumeForWorkType(workType, params);
        String unit = getUnitForWorkType(workType);

        return new VolumeCalculationResponse(
                null,
                workType,
                params,
                result,
                unit,
                null
        );
    }

    @Transactional
    public VolumeCalculationResponse saveCalculation(VolumeSaveRequest request) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        String paramsJson;
        try {
            paramsJson = objectMapper.writeValueAsString(request.params());
        } catch (JsonProcessingException e) {
            paramsJson = "{}";
        }

        VolumeCalculation calculation = VolumeCalculation.builder()
                .organizationId(organizationId)
                .workType(request.workType())
                .params(paramsJson)
                .result(BigDecimal.valueOf(request.result()))
                .unit(request.unit())
                .linkedEstimateItemId(request.linkedEstimateItemId())
                .build();

        calculation = volumeCalculationRepository.save(calculation);

        log.info("Volume calculation saved: {} = {} {} ({})",
                request.workType(), request.result(), request.unit(), calculation.getId());

        return new VolumeCalculationResponse(
                calculation.getId(),
                calculation.getWorkType(),
                request.params(),
                request.result(),
                request.unit(),
                request.linkedEstimateItemId()
        );
    }

    @Transactional(readOnly = true)
    public List<VolumeCalculationResponse> getSavedCalculations(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        List<VolumeCalculation> calculations;
        if (projectId != null) {
            calculations = volumeCalculationRepository
                    .findByOrganizationIdAndProjectIdAndDeletedFalseOrderByCreatedAtDesc(organizationId, projectId);
        } else {
            calculations = volumeCalculationRepository
                    .findByOrganizationIdAndDeletedFalseOrderByCreatedAtDesc(organizationId);
        }

        return calculations.stream()
                .map(c -> {
                    Map<String, Double> parsedParams = parseParams(c.getParams());
                    return VolumeCalculationResponse.fromEntity(c, parsedParams);
                })
                .toList();
    }

    // === Plan vs. Fact Comparison ===

    @Transactional(readOnly = true)
    public EstimateComparisonResponse getComparison(UUID estimateId) {
        log.info("Getting plan vs fact comparison for estimate: {}", estimateId);

        // Stub: return realistic placeholder structure
        var sampleItems = List.of(
                new EstimateComparisonResponse.ComparisonItem(
                        "Бетонные работы", "м³",
                        100.0, 5000.0, 500000.0,
                        95.0, 5200.0, 494000.0,
                        6000.0, 1.2
                ),
                new EstimateComparisonResponse.ComparisonItem(
                        "Арматура", "т",
                        12.0, 85000.0, 1020000.0,
                        12.5, 87000.0, 1087500.0,
                        -67500.0, -6.6
                )
        );

        var section = new EstimateComparisonResponse.ComparisonSection(
                "Общестроительные работы",
                sampleItems
        );

        double totalPlan = sampleItems.stream().mapToDouble(EstimateComparisonResponse.ComparisonItem::planTotal).sum();
        double totalFact = sampleItems.stream().mapToDouble(EstimateComparisonResponse.ComparisonItem::factTotal).sum();

        return new EstimateComparisonResponse(
                List.of(section),
                totalPlan,
                totalFact,
                totalPlan - totalFact
        );
    }

    // === Normative Rate Search ===

    @Transactional(readOnly = true)
    public List<NormativeRateSearchResponse> searchNormativeRates(String query, String source) {
        log.info("Searching normative rates: query='{}', source='{}'", query, source);

        if (query == null || query.trim().length() < 2) {
            return List.of();
        }

        // Stub: return placeholder normative rate data
        List<NormativeRateSearchResponse> results = new ArrayList<>();

        results.add(new NormativeRateSearchResponse(
                "ГЭСН 06-01-001-01", "Устройство бетонных фундаментов", "GESN",
                "100 м³", 12450.0, 3200.0, 7800.0, 1450.0
        ));
        results.add(new NormativeRateSearchResponse(
                "ФЕР 06-01-001-01", "Устройство бетонных фундаментов", "FER",
                "100 м³", 15600.0, 4100.0, 9500.0, 2000.0
        ));
        results.add(new NormativeRateSearchResponse(
                "ТЕР 06-01-001-01", "Устройство бетонных фундаментов", "TER",
                "100 м³", 18200.0, 4800.0, 11000.0, 2400.0
        ));

        // Filter by source if provided
        if (source != null && !source.isBlank()) {
            results = results.stream()
                    .filter(r -> r.source().equalsIgnoreCase(source))
                    .toList();
        }

        return results;
    }

    // === Import LSR (hierarchical xlsx) ===

    @Transactional
    public ImportLsrResponse importLsr(ImportLsrRequest request) {
        log.info("Importing hierarchical LSR: estimateName={}, lines={}",
                request.estimateName(), request.lines() != null ? request.lines().size() : 0);

        int lineCount = request.lines() != null ? request.lines().size() : 0;

        // Stub: return realistic result
        return ImportLsrResponse.builder()
                .estimateId(request.estimateId() != null ? UUID.fromString(request.estimateId()) : UUID.randomUUID())
                .sectionsCreated(Math.max(1, lineCount / 10))
                .positionsCreated(Math.max(0, lineCount / 3))
                .resourcesCreated(Math.max(0, lineCount / 2))
                .fmItemsCreated(0)
                .fmItemsUpdated(0)
                .specLinked(0)
                .build();
    }

    // === Private Helpers ===

    private double calculateVolumeForWorkType(String workType, Map<String, Double> params) {
        return switch (workType) {
            case "earthwork" -> {
                double length = params.getOrDefault("length", 0.0);
                double width = params.getOrDefault("width", 0.0);
                double depth = params.getOrDefault("depth", 0.0);
                yield length * width * depth;
            }
            case "concrete" -> {
                double length = params.getOrDefault("length", 0.0);
                double width = params.getOrDefault("width", 0.0);
                double thickness = params.getOrDefault("thickness", 0.0);
                yield length * width * thickness;
            }
            case "masonry" -> {
                double length = params.getOrDefault("length", 0.0);
                double height = params.getOrDefault("height", 0.0);
                double thickness = params.getOrDefault("thickness", 0.0);
                yield length * height * thickness;
            }
            case "roofing" -> {
                double length = params.getOrDefault("length", 0.0);
                double width = params.getOrDefault("width", 0.0);
                yield length * width;
            }
            case "finishing" -> {
                double length = params.getOrDefault("length", 0.0);
                double height = params.getOrDefault("height", 0.0);
                yield length * height;
            }
            default -> 0.0;
        };
    }

    private String getUnitForWorkType(String workType) {
        return switch (workType) {
            case "earthwork", "concrete", "masonry" -> "м³";
            case "roofing", "finishing" -> "м²";
            default -> "ед.";
        };
    }

    private Map<String, Double> parseParams(String paramsJson) {
        if (paramsJson == null || paramsJson.isBlank()) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(paramsJson, new TypeReference<Map<String, Double>>() {});
        } catch (JsonProcessingException e) {
            return Map.of();
        }
    }
}
