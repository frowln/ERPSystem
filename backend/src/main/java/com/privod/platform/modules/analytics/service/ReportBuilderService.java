package com.privod.platform.modules.analytics.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.analytics.domain.ReportBuilderExecution;
import com.privod.platform.modules.analytics.domain.ReportChartType;
import com.privod.platform.modules.analytics.domain.ReportDataSource;
import com.privod.platform.modules.analytics.domain.ReportExecutionStatus;
import com.privod.platform.modules.analytics.domain.ReportOutputFormat;
import com.privod.platform.modules.analytics.domain.ReportTemplate;
import com.privod.platform.modules.analytics.repository.ReportBuilderExecutionRepository;
import com.privod.platform.modules.analytics.repository.AnalyticsReportTemplateRepository;
import com.privod.platform.modules.analytics.web.dto.CreateReportTemplateRequest;
import com.privod.platform.modules.analytics.web.dto.DataSourceInfo;
import com.privod.platform.modules.analytics.web.dto.ExecuteReportBuilderRequest;
import com.privod.platform.modules.analytics.web.dto.FieldInfo;
import com.privod.platform.modules.analytics.web.dto.ReportBuilderExecutionResponse;
import com.privod.platform.modules.analytics.web.dto.ReportTemplateResponse;
import com.privod.platform.modules.analytics.web.dto.UpdateReportTemplateRequest;
import com.privod.platform.modules.closing.domain.Ks2Document;
import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.dailylog.domain.DailyLog;
import com.privod.platform.modules.finance.domain.Invoice;
import com.privod.platform.modules.finance.domain.Payment;
import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.procurement.domain.PurchaseRequest;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.quality.domain.QualityCheck;
import com.privod.platform.modules.safety.domain.SafetyIncident;
import com.privod.platform.modules.task.domain.ProjectTask;
import com.privod.platform.modules.warehouse.domain.Material;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportBuilderService {

    private final AnalyticsReportTemplateRepository templateRepository;
    private final ReportBuilderExecutionRepository executionRepository;
    private final AuditService auditService;
    private final EntityManager entityManager;
    private final ObjectMapper objectMapper;

    private static final Map<ReportDataSource, Class<?>> DATA_SOURCE_ENTITY_MAP = new EnumMap<>(ReportDataSource.class);
    private static final Map<ReportDataSource, List<FieldInfo>> DATA_SOURCE_FIELDS = new EnumMap<>(ReportDataSource.class);

    static {
        DATA_SOURCE_ENTITY_MAP.put(ReportDataSource.PROJECTS, Project.class);
        DATA_SOURCE_ENTITY_MAP.put(ReportDataSource.CONTRACTS, Contract.class);
        DATA_SOURCE_ENTITY_MAP.put(ReportDataSource.INVOICES, Invoice.class);
        DATA_SOURCE_ENTITY_MAP.put(ReportDataSource.PAYMENTS, Payment.class);
        DATA_SOURCE_ENTITY_MAP.put(ReportDataSource.EMPLOYEES, Employee.class);
        DATA_SOURCE_ENTITY_MAP.put(ReportDataSource.MATERIALS, Material.class);
        DATA_SOURCE_ENTITY_MAP.put(ReportDataSource.DAILY_LOGS, DailyLog.class);
        DATA_SOURCE_ENTITY_MAP.put(ReportDataSource.QUALITY_CHECKS, QualityCheck.class);
        DATA_SOURCE_ENTITY_MAP.put(ReportDataSource.SAFETY_INCIDENTS, SafetyIncident.class);
        DATA_SOURCE_ENTITY_MAP.put(ReportDataSource.KS2_DOCUMENTS, Ks2Document.class);
        DATA_SOURCE_ENTITY_MAP.put(ReportDataSource.TASKS, ProjectTask.class);
        DATA_SOURCE_ENTITY_MAP.put(ReportDataSource.PURCHASE_REQUESTS, PurchaseRequest.class);

        initFieldDefinitions();
    }

    // ===================== Templates CRUD =====================

    @Transactional(readOnly = true)
    public Page<ReportTemplateResponse> getTemplates(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();
        return templateRepository.findPublicOrOwnedBy(orgId, userId, pageable)
                .map(ReportTemplateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ReportTemplateResponse getTemplate(UUID id) {
        ReportTemplate template = getTemplateOrThrow(id);
        return ReportTemplateResponse.fromEntity(template);
    }

    @Transactional
    public ReportTemplateResponse createTemplate(CreateReportTemplateRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        ReportTemplate template = ReportTemplate.builder()
                .organizationId(orgId)
                .name(request.name())
                .description(request.description())
                .dataSource(request.dataSource())
                .columnsJson(request.columnsJson() != null ? request.columnsJson() : "[]")
                .filtersJson(request.filtersJson() != null ? request.filtersJson() : "[]")
                .groupByJson(request.groupByJson() != null ? request.groupByJson() : "[]")
                .sortByJson(request.sortByJson() != null ? request.sortByJson() : "[]")
                .chartType(request.chartType() != null ? request.chartType() : ReportChartType.NONE)
                .chartConfigJson(request.chartConfigJson())
                .isPublic(request.isPublic() != null && request.isPublic())
                .scheduleEnabled(request.scheduleEnabled() != null && request.scheduleEnabled())
                .scheduleCron(request.scheduleCron())
                .scheduleRecipients(request.scheduleRecipients() != null ? request.scheduleRecipients() : "[]")
                .createdById(userId)
                .build();

        template = templateRepository.save(template);
        auditService.logCreate("ReportTemplate", template.getId());

        log.info("Report template created: {} ({})", template.getName(), template.getId());
        return ReportTemplateResponse.fromEntity(template);
    }

    @Transactional
    public ReportTemplateResponse updateTemplate(UUID id, UpdateReportTemplateRequest request) {
        ReportTemplate template = getTemplateOrThrow(id);

        if (request.name() != null) {
            template.setName(request.name());
        }
        if (request.description() != null) {
            template.setDescription(request.description());
        }
        if (request.dataSource() != null) {
            template.setDataSource(request.dataSource());
        }
        if (request.columnsJson() != null) {
            template.setColumnsJson(request.columnsJson());
        }
        if (request.filtersJson() != null) {
            template.setFiltersJson(request.filtersJson());
        }
        if (request.groupByJson() != null) {
            template.setGroupByJson(request.groupByJson());
        }
        if (request.sortByJson() != null) {
            template.setSortByJson(request.sortByJson());
        }
        if (request.chartType() != null) {
            template.setChartType(request.chartType());
        }
        if (request.chartConfigJson() != null) {
            template.setChartConfigJson(request.chartConfigJson());
        }
        if (request.isPublic() != null) {
            template.setPublic(request.isPublic());
        }
        if (request.scheduleEnabled() != null) {
            template.setScheduleEnabled(request.scheduleEnabled());
        }
        if (request.scheduleCron() != null) {
            template.setScheduleCron(request.scheduleCron());
        }
        if (request.scheduleRecipients() != null) {
            template.setScheduleRecipients(request.scheduleRecipients());
        }

        template = templateRepository.save(template);
        auditService.logUpdate("ReportTemplate", template.getId(), "multiple", null, null);

        log.info("Report template updated: {} ({})", template.getName(), template.getId());
        return ReportTemplateResponse.fromEntity(template);
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        ReportTemplate template = getTemplateOrThrow(id);
        template.softDelete();
        templateRepository.save(template);
        auditService.logDelete("ReportTemplate", id);
        log.info("Report template soft-deleted: {} ({})", template.getName(), id);
    }

    @Transactional
    public ReportTemplateResponse duplicateTemplate(UUID id) {
        ReportTemplate source = getTemplateOrThrow(id);
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        ReportTemplate copy = ReportTemplate.builder()
                .organizationId(orgId)
                .name(source.getName() + " (копия)")
                .description(source.getDescription())
                .dataSource(source.getDataSource())
                .columnsJson(source.getColumnsJson())
                .filtersJson(source.getFiltersJson())
                .groupByJson(source.getGroupByJson())
                .sortByJson(source.getSortByJson())
                .chartType(source.getChartType())
                .chartConfigJson(source.getChartConfigJson())
                .isPublic(false)
                .scheduleEnabled(false)
                .scheduleCron(null)
                .scheduleRecipients("[]")
                .createdById(userId)
                .build();

        copy = templateRepository.save(copy);
        auditService.logCreate("ReportTemplate", copy.getId());

        log.info("Report template duplicated: {} -> {} ({})", source.getId(), copy.getName(), copy.getId());
        return ReportTemplateResponse.fromEntity(copy);
    }

    // ===================== Report Execution =====================

    @Transactional
    public ReportBuilderExecutionResponse executeReport(UUID templateId, ExecuteReportBuilderRequest request) {
        ReportTemplate template = getTemplateOrThrow(templateId);
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        ReportOutputFormat outputFormat = request != null && request.outputFormat() != null
                ? request.outputFormat()
                : ReportOutputFormat.JSON;

        ReportBuilderExecution execution = ReportBuilderExecution.builder()
                .organizationId(orgId)
                .templateId(templateId)
                .executedById(userId)
                .parametersJson(request != null && request.parametersJson() != null ? request.parametersJson() : "{}")
                .outputFormat(outputFormat)
                .status(ReportExecutionStatus.RUNNING)
                .build();

        execution = executionRepository.save(execution);

        long startTime = System.currentTimeMillis();
        List<Object> data;

        try {
            data = executeQuery(template, orgId);

            long executionTime = System.currentTimeMillis() - startTime;

            execution.setStatus(ReportExecutionStatus.COMPLETED);
            execution.setRowCount(data.size());
            execution.setExecutionTimeMs(executionTime);

            if (outputFormat != ReportOutputFormat.JSON) {
                String outputPath = String.format("/reports/output/%s/%s.%s",
                        templateId, execution.getId(), outputFormat.name().toLowerCase());
                execution.setOutputPath(outputPath);
            }

            execution = executionRepository.save(execution);

            template.setLastRunAt(Instant.now());
            templateRepository.save(template);

            log.info("Report executed successfully: template={} execution={} rows={} time={}ms",
                    templateId, execution.getId(), data.size(), executionTime);

        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            execution.setStatus(ReportExecutionStatus.FAILED);
            execution.setExecutionTimeMs(executionTime);
            execution.setErrorMessage(e.getMessage());
            execution = executionRepository.save(execution);

            log.error("Report execution failed: template={} execution={}", templateId, execution.getId(), e);
            return ReportBuilderExecutionResponse.fromEntity(execution);
        }

        return ReportBuilderExecutionResponse.fromEntity(execution, data);
    }

    // ===================== Metadata =====================

    @Transactional(readOnly = true)
    public List<DataSourceInfo> getAvailableDataSources() {
        return Arrays.stream(ReportDataSource.values())
                .map(ds -> {
                    List<FieldInfo> fields = DATA_SOURCE_FIELDS.getOrDefault(ds, List.of());
                    return new DataSourceInfo(ds.name(), ds.getDisplayName(), ds.getDescription(), fields.size());
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FieldInfo> getAvailableFields(ReportDataSource dataSource) {
        return DATA_SOURCE_FIELDS.getOrDefault(dataSource, List.of());
    }

    @Transactional(readOnly = true)
    public Page<ReportBuilderExecutionResponse> getExecutionHistory(UUID templateId, Pageable pageable) {
        getTemplateOrThrow(templateId);
        return executionRepository.findByTemplateIdAndDeletedFalseOrderByCreatedAtDesc(templateId, pageable)
                .map(ReportBuilderExecutionResponse::fromEntity);
    }

    // ===================== Dynamic Query =====================

    @SuppressWarnings("unchecked")
    private List<Object> executeQuery(ReportTemplate template, UUID orgId) {
        Class<?> entityClass = DATA_SOURCE_ENTITY_MAP.get(template.getDataSource());
        if (entityClass == null) {
            throw new IllegalArgumentException("Неподдерживаемый источник данных: " + template.getDataSource());
        }

        String alias = "e";
        StringBuilder jpql = new StringBuilder();
        jpql.append("SELECT ").append(alias).append(" FROM ").append(entityClass.getSimpleName()).append(" ").append(alias);

        List<String> conditions = new ArrayList<>();
        Map<String, Object> parameters = new HashMap<>();

        // Always filter by deleted = false
        conditions.add(alias + ".deleted = false");

        // Tenant filter for entities with organizationId
        if (hasOrganizationId(template.getDataSource())) {
            conditions.add(alias + ".organizationId = :orgId");
            parameters.put("orgId", orgId);
        }

        // Parse template filters
        List<Map<String, String>> filters = parseJsonArray(template.getFiltersJson());
        int filterIdx = 0;
        for (Map<String, String> filter : filters) {
            String field = filter.get("field");
            String operator = filter.get("operator");
            String value = filter.get("value");

            if (field == null || operator == null || value == null) {
                continue;
            }

            // Validate field name (prevent injection)
            if (!isValidFieldName(field)) {
                continue;
            }

            String paramName = "fp" + filterIdx;
            String condition = buildFilterCondition(alias, field, operator, paramName);
            if (condition != null) {
                conditions.add(condition);
                parameters.put(paramName, convertFilterValue(value, operator));
                filterIdx++;
            }
        }

        if (!conditions.isEmpty()) {
            jpql.append(" WHERE ").append(String.join(" AND ", conditions));
        }

        // Parse sort definitions
        List<Map<String, String>> sorts = parseJsonArray(template.getSortByJson());
        if (!sorts.isEmpty()) {
            List<String> orderClauses = new ArrayList<>();
            for (Map<String, String> sort : sorts) {
                String field = sort.get("field");
                String direction = sort.get("direction");
                if (field != null && isValidFieldName(field)) {
                    String dir = "DESC".equalsIgnoreCase(direction) ? "DESC" : "ASC";
                    orderClauses.add(alias + "." + field + " " + dir);
                }
            }
            if (!orderClauses.isEmpty()) {
                jpql.append(" ORDER BY ").append(String.join(", ", orderClauses));
            }
        } else {
            jpql.append(" ORDER BY ").append(alias).append(".createdAt DESC");
        }

        TypedQuery<Object> query = (TypedQuery<Object>) entityManager.createQuery(jpql.toString(), entityClass);

        for (Map.Entry<String, Object> entry : parameters.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }

        // Limit results to prevent memory issues
        query.setMaxResults(10000);

        return query.getResultList();
    }

    private boolean hasOrganizationId(ReportDataSource dataSource) {
        // All our data sources have organizationId except ProjectTask and Ks2Document
        return dataSource != ReportDataSource.TASKS && dataSource != ReportDataSource.KS2_DOCUMENTS;
    }

    private String buildFilterCondition(String alias, String field, String operator, String paramName) {
        return switch (operator.toUpperCase()) {
            case "EQ", "EQUALS" -> alias + "." + field + " = :" + paramName;
            case "NEQ", "NOT_EQUALS" -> alias + "." + field + " != :" + paramName;
            case "GT", "GREATER_THAN" -> alias + "." + field + " > :" + paramName;
            case "GTE", "GREATER_OR_EQUAL" -> alias + "." + field + " >= :" + paramName;
            case "LT", "LESS_THAN" -> alias + "." + field + " < :" + paramName;
            case "LTE", "LESS_OR_EQUAL" -> alias + "." + field + " <= :" + paramName;
            case "LIKE", "CONTAINS" -> alias + "." + field + " LIKE :" + paramName;
            case "IS_NULL" -> alias + "." + field + " IS NULL";
            case "IS_NOT_NULL" -> alias + "." + field + " IS NOT NULL";
            default -> null;
        };
    }

    private Object convertFilterValue(String value, String operator) {
        if ("LIKE".equalsIgnoreCase(operator) || "CONTAINS".equalsIgnoreCase(operator)) {
            return "%" + value + "%";
        }
        return value;
    }

    private boolean isValidFieldName(String field) {
        return field != null && field.matches("^[a-zA-Z][a-zA-Z0-9]*$");
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, String>> parseJsonArray(String json) {
        if (json == null || json.isBlank() || "[]".equals(json.trim())) {
            return List.of();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<Map<String, String>>>() {});
        } catch (Exception e) {
            log.warn("Failed to parse JSON array: {}", json, e);
            return List.of();
        }
    }

    private ReportTemplate getTemplateOrThrow(UUID id) {
        return templateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Шаблон отчёта не найден: " + id));
    }

    // ===================== Field Definitions =====================

    private static void initFieldDefinitions() {
        DATA_SOURCE_FIELDS.put(ReportDataSource.PROJECTS, List.of(
                new FieldInfo("code", "Код", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("name", "Название", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("status", "Статус", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("type", "Тип", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("priority", "Приоритет", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("budgetAmount", "Бюджет", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("contractAmount", "Сумма контракта", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("plannedStartDate", "План. начало", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("plannedEndDate", "План. окончание", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("actualStartDate", "Факт. начало", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("actualEndDate", "Факт. окончание", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("city", "Город", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("region", "Регион", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("category", "Категория", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("createdAt", "Дата создания", FieldInfo.FieldType.DATE, true, true, false)
        ));

        DATA_SOURCE_FIELDS.put(ReportDataSource.CONTRACTS, List.of(
                new FieldInfo("name", "Название", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("number", "Номер", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("status", "Статус", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("amount", "Сумма", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("totalWithVat", "Сумма с НДС", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("partnerName", "Контрагент", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("contractDate", "Дата договора", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("plannedStartDate", "План. начало", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("plannedEndDate", "План. окончание", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("totalInvoiced", "Выставлено счетов", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("totalPaid", "Оплачено", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("createdAt", "Дата создания", FieldInfo.FieldType.DATE, true, true, false)
        ));

        DATA_SOURCE_FIELDS.put(ReportDataSource.INVOICES, List.of(
                new FieldInfo("number", "Номер", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("invoiceDate", "Дата счёта", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("dueDate", "Срок оплаты", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("invoiceType", "Тип", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("status", "Статус", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("totalAmount", "Сумма", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("paidAmount", "Оплачено", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("partnerName", "Контрагент", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("createdAt", "Дата создания", FieldInfo.FieldType.DATE, true, true, false)
        ));

        DATA_SOURCE_FIELDS.put(ReportDataSource.PAYMENTS, List.of(
                new FieldInfo("number", "Номер", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("paymentDate", "Дата платежа", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("paymentType", "Тип", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("status", "Статус", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("amount", "Сумма", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("totalAmount", "Итого", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("partnerName", "Контрагент", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("purpose", "Назначение", FieldInfo.FieldType.STRING, true, false, false),
                new FieldInfo("createdAt", "Дата создания", FieldInfo.FieldType.DATE, true, true, false)
        ));

        DATA_SOURCE_FIELDS.put(ReportDataSource.EMPLOYEES, List.of(
                new FieldInfo("employeeNumber", "Табельный номер", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("fullName", "ФИО", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("firstName", "Имя", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("lastName", "Фамилия", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("position", "Должность", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("status", "Статус", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("hireDate", "Дата приёма", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("terminationDate", "Дата увольнения", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("hourlyRate", "Часовая ставка", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("monthlyRate", "Оклад", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("email", "Email", FieldInfo.FieldType.STRING, true, false, false),
                new FieldInfo("phone", "Телефон", FieldInfo.FieldType.STRING, true, false, false)
        ));

        DATA_SOURCE_FIELDS.put(ReportDataSource.MATERIALS, List.of(
                new FieldInfo("code", "Код", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("name", "Название", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("category", "Категория", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("unitOfMeasure", "Ед. измерения", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("currentPrice", "Текущая цена", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("minStockLevel", "Мин. остаток", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("active", "Активен", FieldInfo.FieldType.BOOLEAN, true, true, true),
                new FieldInfo("createdAt", "Дата создания", FieldInfo.FieldType.DATE, true, true, false)
        ));

        DATA_SOURCE_FIELDS.put(ReportDataSource.DAILY_LOGS, List.of(
                new FieldInfo("code", "Код", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("logDate", "Дата", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("weatherConditions", "Погода", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("status", "Статус", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("temperatureMin", "Мин. температура", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("temperatureMax", "Макс. температура", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("shiftSupervisorName", "Руководитель смены", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("createdAt", "Дата создания", FieldInfo.FieldType.DATE, true, true, false)
        ));

        DATA_SOURCE_FIELDS.put(ReportDataSource.QUALITY_CHECKS, List.of(
                new FieldInfo("code", "Код", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("name", "Название", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("checkType", "Тип проверки", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("status", "Статус", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("result", "Результат", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("plannedDate", "План. дата", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("actualDate", "Факт. дата", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("inspectorName", "Инспектор", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("createdAt", "Дата создания", FieldInfo.FieldType.DATE, true, true, false)
        ));

        DATA_SOURCE_FIELDS.put(ReportDataSource.SAFETY_INCIDENTS, List.of(
                new FieldInfo("number", "Номер", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("incidentDate", "Дата инцидента", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("severity", "Тяжесть", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("incidentType", "Тип", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("status", "Статус", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("description", "Описание", FieldInfo.FieldType.STRING, true, false, false),
                new FieldInfo("reportedByName", "Сообщил", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("locationDescription", "Место", FieldInfo.FieldType.STRING, true, false, false),
                new FieldInfo("workDaysLost", "Дней потеряно", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("medicalTreatment", "Мед. помощь", FieldInfo.FieldType.BOOLEAN, true, true, true),
                new FieldInfo("createdAt", "Дата создания", FieldInfo.FieldType.DATE, true, true, false)
        ));

        DATA_SOURCE_FIELDS.put(ReportDataSource.KS2_DOCUMENTS, List.of(
                new FieldInfo("number", "Номер", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("name", "Название", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("documentDate", "Дата документа", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("status", "Статус", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("totalAmount", "Сумма", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("totalWithVat", "Сумма с НДС", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("totalQuantity", "Объём", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("createdAt", "Дата создания", FieldInfo.FieldType.DATE, true, true, false)
        ));

        DATA_SOURCE_FIELDS.put(ReportDataSource.TASKS, List.of(
                new FieldInfo("code", "Код", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("title", "Название", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("status", "Статус", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("priority", "Приоритет", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("assigneeName", "Исполнитель", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("reporterName", "Автор", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("plannedStartDate", "План. начало", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("plannedEndDate", "План. окончание", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("estimatedHours", "План. часы", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("actualHours", "Факт. часы", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("progress", "Прогресс", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("createdAt", "Дата создания", FieldInfo.FieldType.DATE, true, true, false)
        ));

        DATA_SOURCE_FIELDS.put(ReportDataSource.PURCHASE_REQUESTS, List.of(
                new FieldInfo("name", "Название", FieldInfo.FieldType.STRING, true, true, false),
                new FieldInfo("requestDate", "Дата заявки", FieldInfo.FieldType.DATE, true, true, false),
                new FieldInfo("status", "Статус", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("priority", "Приоритет", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("totalAmount", "Сумма", FieldInfo.FieldType.NUMBER, true, true, false),
                new FieldInfo("requestedByName", "Запросил", FieldInfo.FieldType.STRING, true, true, true),
                new FieldInfo("createdAt", "Дата создания", FieldInfo.FieldType.DATE, true, true, false)
        ));
    }
}
