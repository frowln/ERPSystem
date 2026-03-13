package com.privod.platform.modules.estimate.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.estimate.domain.CalculationMethod;
import com.privod.platform.modules.estimate.domain.ExportHistory;
import com.privod.platform.modules.estimate.domain.ImportHistory;
import com.privod.platform.modules.estimate.domain.LocalEstimate;
import com.privod.platform.modules.estimate.domain.LocalEstimateLine;
import com.privod.platform.modules.estimate.domain.LocalEstimateStatus;
import com.privod.platform.modules.estimate.domain.VolumeCalculation;
import com.privod.platform.modules.estimate.repository.ExportHistoryRepository;
import com.privod.platform.modules.estimate.repository.ImportHistoryRepository;
import com.privod.platform.modules.estimate.repository.LocalEstimateLineRepository;
import com.privod.platform.modules.estimate.repository.LocalEstimateRepository;
import com.privod.platform.modules.estimate.repository.VolumeCalculationRepository;
import com.privod.platform.modules.estimate.web.dto.ArpsImportResult;
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
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
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
    private final LocalEstimateRepository localEstimateRepository;
    private final LocalEstimateLineRepository localEstimateLineRepository;
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

    // === ARPS 1.10 XML Import (P1-EST-4) ===

    /**
     * Импорт сметы из формата ARPS 1.10 XML (ГРАНД-Смета, Smeta.RU и др.).
     * <p>
     * Поддерживаемые варианты корневых тегов:
     * ОбъектДанных, СтройКА_Смета, Document.
     * <p>
     * Типичная структура документа:
     * РазделыСметы / РаздСметы[@Наименование] / ПозицияСметы
     *   - КодНорматива или Шифр (нормативный код)
     *   - Наименование или НаимРаботИЗатрат (наименование работы)
     *   - ЕдИзм (единица измерения)
     *   - КолВо или ОбъемРабот (количество)
     *   - ЦенаЕд или СтоимЕдБаз (цена единицы)
     *   - СтоимВсего или СтоимВсегоТек (стоимость всего)
     *
     * @param xmlData        входной XML-поток
     * @param projectId      UUID проекта (опционально)
     * @param organizationId UUID организации (тенант)
     * @return результат импорта с кол-вом разделов и позиций
     */
    @Transactional
    public ArpsImportResult importArps(InputStream xmlData, UUID projectId, UUID organizationId) {
        log.info("Starting ARPS 1.10 XML import: projectId={}, organizationId={}", projectId, organizationId);

        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            // XXE prevention: disable external entity processing
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setExpandEntityReferences(false);

            DocumentBuilder builder = factory.newDocumentBuilder();
            Document doc = builder.parse(xmlData);
            doc.getDocumentElement().normalize();

            Element root = doc.getDocumentElement();
            log.debug("ARPS root element: <{}>", root.getNodeName());

            // Parse estimate header
            String estimateName = firstText(root, "Наименование", "НаимСметы", "Name", "Смета");
            if (estimateName == null || estimateName.isBlank()) {
                estimateName = "Смета из ARPS " + Instant.now();
            }
            String estimateNumber = firstText(root, "Номер", "НомСметы", "Number");
            String objectName = firstText(root, "НаимОбъекта", "ОбъектНаименование", "ObjectName");

            // Create LocalEstimate record
            LocalEstimate estimate = LocalEstimate.builder()
                    .organizationId(organizationId)
                    .projectId(projectId)
                    .name(estimateName)
                    .number(estimateNumber)
                    .objectName(objectName)
                    .calculationMethod(CalculationMethod.RIM)
                    .status(LocalEstimateStatus.DRAFT)
                    .build();
            estimate = localEstimateRepository.save(estimate);

            int sectionsCreated = 0;
            int positionsCreated = 0;
            int lineNumber = 1;

            // Find section container: РазделыСметы or fall back to direct РаздСметы
            NodeList sectionContainers = root.getElementsByTagName("\u0420\u0430\u0437\u0434\u0435\u043b\u044b\u0421\u043c\u0435\u0442\u044b");
            NodeList sections;
            if (sectionContainers.getLength() > 0) {
                Element sectionsEl = (Element) sectionContainers.item(0);
                sections = sectionsEl.getElementsByTagName("\u0420\u0430\u0437\u0434\u0421\u043c\u0435\u0442\u044b");
            } else {
                sections = root.getElementsByTagName("\u0420\u0430\u0437\u0434\u0421\u043c\u0435\u0442\u044b");
            }

            if (sections.getLength() > 0) {
                // Structured format: sections -> positions
                for (int si = 0; si < sections.getLength(); si++) {
                    Element sectionEl = (Element) sections.item(si);
                    String sectionName = attrOrChild(sectionEl,
                            "\u041d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0435",
                            "\u041d\u0430\u0438\u043c\u0435\u043d\u043e\u0432\u0430\u043d\u0438\u0435");
                    if (sectionName == null) sectionName = "Раздел " + (si + 1);

                    // Section header line (no cost fields)
                    LocalEstimateLine sectionLine = LocalEstimateLine.builder()
                            .estimateId(estimate.getId())
                            .lineNumber(lineNumber++)
                            .name(sectionName)
                            .quantity(BigDecimal.ZERO)
                            .unit("")
                            .notes("ARPS раздел")
                            .build();
                    localEstimateLineRepository.save(sectionLine);
                    sectionsCreated++;

                    // Positions within this section
                    NodeList positions = sectionEl.getElementsByTagName(
                            "\u041f\u043e\u0437\u0438\u0446\u0438\u044f\u0421\u043c\u0435\u0442\u044b");
                    for (int pi = 0; pi < positions.getLength(); pi++) {
                        Element posEl = (Element) positions.item(pi);
                        LocalEstimateLine line = parseArpsPosition(posEl, estimate.getId(), lineNumber++);
                        if (line != null) {
                            localEstimateLineRepository.save(line);
                            positionsCreated++;
                        }
                    }
                }
            } else {
                // Flat format: positions directly under root
                NodeList positions = root.getElementsByTagName(
                        "\u041f\u043e\u0437\u0438\u0446\u0438\u044f\u0421\u043c\u0435\u0442\u044b");
                for (int pi = 0; pi < positions.getLength(); pi++) {
                    Element posEl = (Element) positions.item(pi);
                    LocalEstimateLine line = parseArpsPosition(posEl, estimate.getId(), lineNumber++);
                    if (line != null) {
                        localEstimateLineRepository.save(line);
                        positionsCreated++;
                    }
                }
            }

            // Record import in history
            ImportHistory history = ImportHistory.builder()
                    .organizationId(organizationId)
                    .fileName("arps-import.xml")
                    .format("ARPS")
                    .importDate(Instant.now())
                    .status("success")
                    .itemsImported(positionsCreated)
                    .build();
            importHistoryRepository.save(history);

            log.info("ARPS import completed: estimateId={}, sections={}, positions={}",
                    estimate.getId(), sectionsCreated, positionsCreated);

            return ArpsImportResult.builder()
                    .estimateId(estimate.getId())
                    .estimateName(estimate.getName())
                    .sectionsCreated(sectionsCreated)
                    .positionsCreated(positionsCreated)
                    .importHistoryId(history.getId())
                    .build();

        } catch (Exception e) {
            log.error("ARPS XML import failed", e);
            throw new IllegalArgumentException("Ошибка разбора ARPS XML: " + e.getMessage(), e);
        }
    }

    /**
     * Парсит элемент ПозицияСметы в LocalEstimateLine.
     * Поддерживает альтернативные имена тегов разных версий экспортёров.
     */
    private LocalEstimateLine parseArpsPosition(Element posEl, UUID estimateId, int lineNumber) {
        String code = firstChildText(posEl, "КодНорматива", "Шифр", "КодРасценки");
        String name = firstChildText(posEl, "Наименование", "НаимРаботИЗатрат", "НаимПозиции");
        if (name == null || name.isBlank()) {
            name = code != null ? code : "Позиция " + lineNumber;
        }
        String unit = firstChildText(posEl, "ЕдИзм", "ЕдиницаИзмерения");
        BigDecimal quantity = parseBigDecimal(firstChildText(posEl, "КолВо", "ОбъемРабот", "Количество"));
        BigDecimal unitPrice = parseBigDecimal(firstChildText(posEl, "ЦенаЕд", "СтоимЕдБаз", "СтоимостьЕд"));
        BigDecimal total = parseBigDecimal(firstChildText(posEl,
                "СтоимВсего", "СтоимВсегоТек", "СтоимостьВсего", "ИтогоПоПозиции"));

        if (total == null && quantity != null && unitPrice != null) {
            total = quantity.multiply(unitPrice);
        }

        return LocalEstimateLine.builder()
                .estimateId(estimateId)
                .lineNumber(lineNumber)
                .normativeCode(code)
                .name(name)
                .unit(unit != null ? unit : "")
                .quantity(quantity != null ? quantity : BigDecimal.ZERO)
                .currentPrice(unitPrice)
                .currentTotal(total != null ? total : BigDecimal.ZERO)
                .directCosts(total != null ? total : BigDecimal.ZERO)
                .build();
    }

    /** Возвращает текст первого найденного дочернего элемента с одним из тегов. */
    private String firstChildText(Element parent, String... tagNames) {
        for (String tag : tagNames) {
            NodeList nodes = parent.getElementsByTagName(tag);
            if (nodes.getLength() > 0) {
                String text = nodes.item(0).getTextContent();
                if (text != null && !text.isBlank()) {
                    return text.trim();
                }
            }
        }
        return null;
    }

    /** Сначала смотрит атрибут, затем дочерний тег. */
    private String attrOrChild(Element el, String attrName, String... fallbackTags) {
        String attrVal = el.getAttribute(attrName);
        if (attrVal != null && !attrVal.isBlank()) {
            return attrVal.trim();
        }
        return firstChildText(el, fallbackTags);
    }

    /** Ищет первый тег среди всех потомков корня и возвращает текст. */
    private String firstText(Element root, String... tagNames) {
        for (String tag : tagNames) {
            NodeList nodes = root.getElementsByTagName(tag);
            if (nodes.getLength() > 0) {
                String text = nodes.item(0).getTextContent();
                if (text != null && !text.isBlank()) {
                    return text.trim();
                }
            }
        }
        return null;
    }

    /**
     * Парсит число из строки ARPS.
     * Поддерживает пробел и неразрывный пробел как разделитель тысяч,
     * запятую как десятичный разделитель (русская локаль).
     */
    private BigDecimal parseBigDecimal(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            String cleaned = s.trim()
                    .replace(" ", "")
                    .replace("\u00A0", "")
                    .replace(",", ".");
            return new BigDecimal(cleaned);
        } catch (NumberFormatException e) {
            return null;
        }
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
