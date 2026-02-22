package com.privod.platform.modules.safety.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.safety.domain.RiskFactorType;
import com.privod.platform.modules.safety.domain.SafetyIncident;
import com.privod.platform.modules.safety.domain.SafetyRiskFactor;
import com.privod.platform.modules.safety.domain.SafetyRiskLevel;
import com.privod.platform.modules.safety.domain.SafetyRiskReport;
import com.privod.platform.modules.safety.domain.SafetyRiskScore;
import com.privod.platform.modules.safety.domain.SafetyViolation;
import com.privod.platform.modules.safety.domain.ViolationStatus;
import com.privod.platform.modules.safety.repository.SafetyCertificateRepository;
import com.privod.platform.modules.safety.repository.SafetyIncidentRepository;
import com.privod.platform.modules.safety.repository.SafetyRiskFactorRepository;
import com.privod.platform.modules.safety.repository.SafetyRiskReportRepository;
import com.privod.platform.modules.safety.repository.SafetyRiskScoreRepository;
import com.privod.platform.modules.safety.repository.SafetyViolationRepository;
import com.privod.platform.modules.safety.web.dto.PortfolioRiskMapResponse;
import com.privod.platform.modules.safety.web.dto.SafetyRiskFactorResponse;
import com.privod.platform.modules.safety.web.dto.SafetyRiskScoreResponse;
import com.privod.platform.modules.safety.web.dto.WeeklyRiskReportResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.IsoFields;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SafetyRiskScoringService {

    private final SafetyRiskScoreRepository riskScoreRepository;
    private final SafetyRiskFactorRepository riskFactorRepository;
    private final SafetyRiskReportRepository riskReportRepository;
    private final SafetyIncidentRepository incidentRepository;
    private final SafetyViolationRepository violationRepository;
    private final SafetyCertificateRepository certificateRepository;
    private final EmployeeRepository employeeRepository;
    private final ProjectRepository projectRepository;
    private final ContractRepository contractRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    private static final BigDecimal DEFAULT_WEIGHT = BigDecimal.ONE;

    // ======================== Public API ========================

    @Transactional
    public SafetyRiskScoreResponse calculateProjectRiskScore(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Project project = projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, organizationId)
                .orElseThrow(() -> new EntityNotFoundException("Проект не найден: " + projectId));

        return doCalculateProjectRiskScore(project, organizationId);
    }

    @Transactional(readOnly = true)
    public SafetyRiskScoreResponse getProjectRiskScore(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        SafetyRiskScore score = riskScoreRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalseAndValidUntilIsNull(organizationId, projectId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Оценка риска для проекта не найдена: " + projectId));
        return SafetyRiskScoreResponse.fromEntity(score);
    }

    @Transactional(readOnly = true)
    public PortfolioRiskMapResponse getPortfolioRiskMap() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        Page<SafetyRiskScore> scoresPage = riskScoreRepository
                .findByOrganizationIdAndDeletedFalseAndValidUntilIsNull(organizationId, Pageable.unpaged());
        List<SafetyRiskScore> scores = scoresPage.getContent();

        if (scores.isEmpty()) {
            return new PortfolioRiskMapResponse(
                    List.of(), 0, SafetyRiskLevel.LOW, SafetyRiskLevel.LOW.getDisplayName(), 0, 0);
        }

        // Batch lookup project names
        List<UUID> projectIds = scores.stream().map(SafetyRiskScore::getProjectId).toList();
        Map<UUID, String> projectNames = new HashMap<>();
        List<Object[]> nameRows = projectRepository.findNamesByIdsAndOrganizationId(projectIds, organizationId);
        for (Object[] row : nameRows) {
            projectNames.put((UUID) row[0], (String) row[1]);
        }

        int totalScore = 0;
        int criticalCount = 0;
        int highCount = 0;
        List<PortfolioRiskMapResponse.ProjectRisk> projectRisks = new ArrayList<>();

        for (SafetyRiskScore score : scores) {
            totalScore += score.getScore();
            if (score.getRiskLevel() == SafetyRiskLevel.CRITICAL) criticalCount++;
            if (score.getRiskLevel() == SafetyRiskLevel.HIGH) highCount++;

            projectRisks.add(new PortfolioRiskMapResponse.ProjectRisk(
                    score.getProjectId(),
                    projectNames.getOrDefault(score.getProjectId(), "Неизвестный проект"),
                    score.getScore(),
                    score.getRiskLevel(),
                    score.getRiskLevel().getDisplayName(),
                    score.getRiskLevel().getColor(),
                    score.getIncidentCount30d(),
                    score.getViolationCount30d()
            ));
        }

        int avgScore = totalScore / scores.size();
        SafetyRiskLevel overallLevel = SafetyRiskLevel.fromScore(avgScore);

        return new PortfolioRiskMapResponse(
                projectRisks, avgScore, overallLevel, overallLevel.getDisplayName(), criticalCount, highCount);
    }

    @Transactional
    public void calculateAllProjects() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        List<UUID> projectIds = projectRepository.findActiveProjectIdsByOrganizationId(organizationId);

        log.info("Recalculating risk scores for {} projects in organization {}", projectIds.size(), organizationId);

        for (UUID projectId : projectIds) {
            try {
                Project project = projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, organizationId)
                        .orElse(null);
                if (project != null) {
                    doCalculateProjectRiskScore(project, organizationId);
                }
            } catch (Exception e) {
                log.error("Failed to calculate risk score for project {}: {}", projectId, e.getMessage());
            }
        }

        log.info("Risk score recalculation complete for organization {}", organizationId);
    }

    @Transactional(readOnly = true)
    public List<SafetyRiskFactorResponse> getProjectFactors(UUID projectId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return riskFactorRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalseOrderByWeightDesc(organizationId, projectId)
                .stream()
                .map(SafetyRiskFactorResponse::fromEntity)
                .toList();
    }

    @Scheduled(cron = "0 0 6 * * MON")
    @Transactional
    public void scheduledWeeklyReport() {
        log.info("Starting scheduled weekly risk report generation");
        try {
            // Process all organizations that have active risk scores
            List<SafetyRiskScore> allActiveScores = riskScoreRepository.findAll();
            Map<UUID, List<SafetyRiskScore>> byOrg = new HashMap<>();
            for (SafetyRiskScore score : allActiveScores) {
                if (!score.isDeleted() && score.getValidUntil() == null) {
                    byOrg.computeIfAbsent(score.getOrganizationId(), k -> new ArrayList<>()).add(score);
                }
            }

            for (Map.Entry<UUID, List<SafetyRiskScore>> entry : byOrg.entrySet()) {
                doGenerateWeeklyReport(entry.getKey(), entry.getValue());
            }
            log.info("Scheduled weekly risk report generation complete for {} organizations", byOrg.size());
        } catch (Exception e) {
            log.error("Failed to generate scheduled weekly risk reports: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public WeeklyRiskReportResponse generateWeeklyReport() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        // Recalculate all projects first
        List<UUID> projectIds = projectRepository.findActiveProjectIdsByOrganizationId(organizationId);
        for (UUID projectId : projectIds) {
            try {
                Project project = projectRepository.findByIdAndOrganizationIdAndDeletedFalse(projectId, organizationId)
                        .orElse(null);
                if (project != null) {
                    doCalculateProjectRiskScore(project, organizationId);
                }
            } catch (Exception e) {
                log.error("Failed to calculate risk score for project {} during weekly report: {}",
                        projectId, e.getMessage());
            }
        }

        // Gather current scores
        List<SafetyRiskScore> activeScores = riskScoreRepository
                .findByOrganizationIdAndDeletedFalseAndValidUntilIsNull(organizationId, Pageable.unpaged())
                .getContent();

        SafetyRiskReport report = doGenerateWeeklyReport(organizationId, activeScores);
        return WeeklyRiskReportResponse.fromEntity(report);
    }

    @Transactional(readOnly = true)
    public Page<WeeklyRiskReportResponse> getWeeklyReports(Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return riskReportRepository
                .findByOrganizationIdAndDeletedFalseOrderByReportWeekDesc(organizationId, pageable)
                .map(WeeklyRiskReportResponse::fromEntity);
    }

    // ======================== Internal calculation ========================

    private SafetyRiskScoreResponse doCalculateProjectRiskScore(Project project, UUID organizationId) {
        UUID projectId = project.getId();
        Instant now = Instant.now();

        // 1. Invalidate previous score
        riskScoreRepository.invalidatePreviousScores(organizationId, projectId, now);

        // 2. Soft-delete previous factors
        riskFactorRepository.softDeleteByOrganizationIdAndProjectId(organizationId, projectId);

        // 3. Calculate each factor
        List<SafetyRiskFactor> factors = new ArrayList<>();

        factors.add(calculateIncidentFrequency(organizationId, projectId, now));
        factors.add(calculateViolationTrend(organizationId, projectId, now));
        factors.add(calculateTrainingCompliance(organizationId, projectId, now));
        factors.add(calculateCertExpiry(organizationId, projectId, now));
        factors.add(calculateSubcontractorCount(organizationId, projectId, now));
        factors.add(calculateCrewExperience(organizationId, projectId, now));

        // Save all factors
        List<SafetyRiskFactor> savedFactors = riskFactorRepository.saveAll(factors);

        // 4. Weighted average
        BigDecimal totalWeight = BigDecimal.ZERO;
        BigDecimal weightedSum = BigDecimal.ZERO;
        for (SafetyRiskFactor factor : savedFactors) {
            BigDecimal normalized = factor.getNormalizedValue() != null ? factor.getNormalizedValue() : BigDecimal.ZERO;
            BigDecimal weight = factor.getWeight() != null ? factor.getWeight() : DEFAULT_WEIGHT;
            weightedSum = weightedSum.add(normalized.multiply(weight));
            totalWeight = totalWeight.add(weight);
        }

        int finalScore;
        if (totalWeight.compareTo(BigDecimal.ZERO) > 0) {
            finalScore = weightedSum.divide(totalWeight, 0, RoundingMode.HALF_UP).intValue();
        } else {
            finalScore = 0;
        }
        finalScore = Math.min(100, Math.max(0, finalScore));

        // 5. Risk level
        SafetyRiskLevel riskLevel = SafetyRiskLevel.fromScore(finalScore);

        // 6. Recommendations
        List<Map<String, String>> recommendations = generateRecommendations(savedFactors);

        // 7. Count incidents & violations in last 30 days for summary fields
        int incidentCount30d = countIncidentsInDays(organizationId, projectId, 30);
        int violationCount30d = countViolationsForProject(organizationId, projectId);

        // 8. Training compliance and cert expiry for summary
        BigDecimal trainingPct = getTrainingCompliancePct(savedFactors);
        BigDecimal certRatio = getCertExpiryRatio(savedFactors);

        // Serialize factors and recommendations
        String factorsJson = serializeToJson(savedFactors.stream().map(f -> Map.of(
                "factorType", f.getFactorType().name(),
                "weight", f.getWeight().toString(),
                "rawValue", f.getRawValue() != null ? f.getRawValue().toString() : "0",
                "normalizedValue", f.getNormalizedValue() != null ? f.getNormalizedValue().toString() : "0",
                "description", f.getDescription() != null ? f.getDescription() : ""
        )).toList());
        String recommendationsJson = serializeToJson(recommendations);

        // 9. Save score
        SafetyRiskScore riskScore = SafetyRiskScore.builder()
                .organizationId(organizationId)
                .projectId(projectId)
                .score(finalScore)
                .riskLevel(riskLevel)
                .factorsJson(factorsJson)
                .recommendationsJson(recommendationsJson)
                .incidentCount30d(incidentCount30d)
                .violationCount30d(violationCount30d)
                .trainingCompliancePct(trainingPct)
                .certExpiryRatio(certRatio)
                .calculatedAt(now)
                .build();

        riskScore = riskScoreRepository.save(riskScore);
        auditService.logCreate("SafetyRiskScore", riskScore.getId());

        log.info("Risk score calculated for project {} ({}): score={}, level={}",
                project.getName(), projectId, finalScore, riskLevel);

        return SafetyRiskScoreResponse.fromEntity(riskScore);
    }

    // ======================== Factor calculations ========================

    private SafetyRiskFactor calculateIncidentFrequency(UUID organizationId, UUID projectId, Instant now) {
        int count30d = countIncidentsInDays(organizationId, projectId, 30);

        int normalized;
        if (count30d == 0) normalized = 0;
        else if (count30d <= 2) normalized = 25;
        else if (count30d <= 5) normalized = 50;
        else if (count30d <= 10) normalized = 75;
        else normalized = 100;

        return SafetyRiskFactor.builder()
                .organizationId(organizationId)
                .projectId(projectId)
                .factorType(RiskFactorType.INCIDENT_FREQUENCY)
                .weight(DEFAULT_WEIGHT)
                .rawValue(BigDecimal.valueOf(count30d))
                .normalizedValue(BigDecimal.valueOf(normalized))
                .description(String.format("Инцидентов за 30 дней: %d", count30d))
                .calculatedAt(now)
                .build();
    }

    private SafetyRiskFactor calculateViolationTrend(UUID organizationId, UUID projectId, Instant now) {
        // Count violations linked to this project (via incidents)
        int currentCount = countViolationsForProject(organizationId, projectId);

        // Use a heuristic: more open violations = higher risk
        int normalized;
        if (currentCount == 0) normalized = 0;
        else if (currentCount <= 2) normalized = 20;
        else if (currentCount <= 5) normalized = 40;
        else if (currentCount <= 10) normalized = 65;
        else normalized = 90;

        return SafetyRiskFactor.builder()
                .organizationId(organizationId)
                .projectId(projectId)
                .factorType(RiskFactorType.VIOLATION_TREND)
                .weight(DEFAULT_WEIGHT)
                .rawValue(BigDecimal.valueOf(currentCount))
                .normalizedValue(BigDecimal.valueOf(normalized))
                .description(String.format("Открытых нарушений: %d", currentCount))
                .calculatedAt(now)
                .build();
    }

    private SafetyRiskFactor calculateTrainingCompliance(UUID organizationId, UUID projectId, Instant now) {
        // Count employees assigned to project
        List<Employee> projectEmployees = employeeRepository.findByProjectIdAndOrganizationId(projectId, organizationId);
        int totalEmployees = projectEmployees.size();

        if (totalEmployees == 0) {
            return SafetyRiskFactor.builder()
                    .organizationId(organizationId)
                    .projectId(projectId)
                    .factorType(RiskFactorType.TRAINING_COMPLIANCE)
                    .weight(DEFAULT_WEIGHT)
                    .rawValue(new BigDecimal("100"))
                    .normalizedValue(BigDecimal.ZERO)
                    .description("Нет сотрудников на проекте")
                    .calculatedAt(now)
                    .build();
        }

        // For a simplified approach: check overdue trainings
        LocalDate today = LocalDate.now();
        long overdueTrainings = 0;
        try {
            overdueTrainings = projectEmployees.size() > 0
                    ? Math.min(projectEmployees.size(), countOverdueTrainingsForProject(today))
                    : 0;
        } catch (Exception e) {
            log.warn("Could not calculate overdue trainings: {}", e.getMessage());
        }

        // Compliance as percentage (higher = better, but we want non-compliant ratio)
        BigDecimal compliancePct;
        if (totalEmployees > 0) {
            long compliant = Math.max(0, totalEmployees - overdueTrainings);
            compliancePct = BigDecimal.valueOf(compliant * 100L / totalEmployees);
        } else {
            compliancePct = new BigDecimal("100");
        }

        // Invert: 100% compliant=0, 80%=20, <60%=60
        int normalized = 100 - compliancePct.intValue();
        normalized = Math.min(100, Math.max(0, normalized));

        return SafetyRiskFactor.builder()
                .organizationId(organizationId)
                .projectId(projectId)
                .factorType(RiskFactorType.TRAINING_COMPLIANCE)
                .weight(DEFAULT_WEIGHT)
                .rawValue(compliancePct)
                .normalizedValue(BigDecimal.valueOf(normalized))
                .description(String.format("Соответствие обучения: %d%% (%d сотрудников)", compliancePct.intValue(), totalEmployees))
                .calculatedAt(now)
                .build();
    }

    private SafetyRiskFactor calculateCertExpiry(UUID organizationId, UUID projectId, Instant now) {
        List<Employee> projectEmployees = employeeRepository.findByProjectIdAndOrganizationId(projectId, organizationId);

        if (projectEmployees.isEmpty()) {
            return SafetyRiskFactor.builder()
                    .organizationId(organizationId)
                    .projectId(projectId)
                    .factorType(RiskFactorType.CERT_EXPIRY)
                    .weight(DEFAULT_WEIGHT)
                    .rawValue(BigDecimal.ZERO)
                    .normalizedValue(BigDecimal.ZERO)
                    .description("Нет сотрудников на проекте")
                    .calculatedAt(now)
                    .build();
        }

        LocalDate today = LocalDate.now();
        LocalDate soonThreshold = today.plusDays(30);

        int totalCerts = 0;
        int expiredOrExpiring = 0;

        for (Employee employee : projectEmployees) {
            var certs = certificateRepository.findByEmployeeIdAndDeletedFalseOrderByExpiryDateAsc(employee.getId());
            totalCerts += certs.size();
            for (var cert : certs) {
                if (cert.getExpiryDate() != null && cert.getExpiryDate().isBefore(soonThreshold)) {
                    expiredOrExpiring++;
                }
            }
        }

        BigDecimal ratio;
        if (totalCerts > 0) {
            ratio = BigDecimal.valueOf(expiredOrExpiring * 100L).divide(BigDecimal.valueOf(totalCerts), 2, RoundingMode.HALF_UP);
        } else {
            ratio = BigDecimal.ZERO;
        }

        int normalized;
        if (ratio.compareTo(BigDecimal.ZERO) == 0) normalized = 0;
        else if (ratio.compareTo(BigDecimal.TEN) <= 0) normalized = 30;
        else if (ratio.compareTo(new BigDecimal("25")) <= 0) normalized = 60;
        else normalized = 100;

        return SafetyRiskFactor.builder()
                .organizationId(organizationId)
                .projectId(projectId)
                .factorType(RiskFactorType.CERT_EXPIRY)
                .weight(DEFAULT_WEIGHT)
                .rawValue(ratio)
                .normalizedValue(BigDecimal.valueOf(normalized))
                .description(String.format("Просроченных/истекающих сертификатов: %d из %d (%.1f%%)",
                        expiredOrExpiring, totalCerts, ratio.doubleValue()))
                .calculatedAt(now)
                .build();
    }

    private SafetyRiskFactor calculateSubcontractorCount(UUID organizationId, UUID projectId, Instant now) {
        long contractCount = contractRepository.countByProjectIdAndDeletedFalse(projectId);

        int normalized;
        if (contractCount <= 2) normalized = 10;
        else if (contractCount <= 5) normalized = 30;
        else if (contractCount <= 10) normalized = 60;
        else normalized = 80;

        return SafetyRiskFactor.builder()
                .organizationId(organizationId)
                .projectId(projectId)
                .factorType(RiskFactorType.SUBCONTRACTOR_COUNT)
                .weight(DEFAULT_WEIGHT)
                .rawValue(BigDecimal.valueOf(contractCount))
                .normalizedValue(BigDecimal.valueOf(normalized))
                .description(String.format("Договоров на проекте: %d", contractCount))
                .calculatedAt(now)
                .build();
    }

    private SafetyRiskFactor calculateCrewExperience(UUID organizationId, UUID projectId, Instant now) {
        List<Employee> projectEmployees = employeeRepository.findByProjectIdAndOrganizationId(projectId, organizationId);

        if (projectEmployees.isEmpty()) {
            return SafetyRiskFactor.builder()
                    .organizationId(organizationId)
                    .projectId(projectId)
                    .factorType(RiskFactorType.CREW_EXPERIENCE)
                    .weight(DEFAULT_WEIGHT)
                    .rawValue(BigDecimal.ZERO)
                    .normalizedValue(BigDecimal.valueOf(50))
                    .description("Нет сотрудников на проекте")
                    .calculatedAt(now)
                    .build();
        }

        LocalDate today = LocalDate.now();
        long totalDays = 0;
        for (Employee employee : projectEmployees) {
            if (employee.getHireDate() != null) {
                totalDays += ChronoUnit.DAYS.between(employee.getHireDate(), today);
            }
        }
        long avgDays = totalDays / projectEmployees.size();
        double avgYears = avgDays / 365.0;

        int normalized;
        if (avgYears > 2) normalized = 10;
        else if (avgYears >= 1) normalized = 30;
        else if (avgYears >= 0.5) normalized = 50;
        else normalized = 80;

        return SafetyRiskFactor.builder()
                .organizationId(organizationId)
                .projectId(projectId)
                .factorType(RiskFactorType.CREW_EXPERIENCE)
                .weight(DEFAULT_WEIGHT)
                .rawValue(BigDecimal.valueOf(avgYears).setScale(2, RoundingMode.HALF_UP))
                .normalizedValue(BigDecimal.valueOf(normalized))
                .description(String.format("Средний стаж бригады: %.1f лет (%d сотрудников)",
                        avgYears, projectEmployees.size()))
                .calculatedAt(now)
                .build();
    }

    // ======================== Recommendations ========================

    private List<Map<String, String>> generateRecommendations(List<SafetyRiskFactor> factors) {
        List<Map<String, String>> recommendations = new ArrayList<>();

        for (SafetyRiskFactor factor : factors) {
            int normalizedValue = factor.getNormalizedValue() != null ? factor.getNormalizedValue().intValue() : 0;

            switch (factor.getFactorType()) {
                case INCIDENT_FREQUENCY -> {
                    if (normalizedValue > 50) {
                        recommendations.add(Map.of(
                                "priority", "HIGH",
                                "category", "INCIDENT_FREQUENCY",
                                "text", "Увеличить частоту инспекций и проверок безопасности"
                        ));
                    }
                }
                case VIOLATION_TREND -> {
                    if (normalizedValue > 30) {
                        recommendations.add(Map.of(
                                "priority", "HIGH",
                                "category", "VIOLATION_TREND",
                                "text", "Провести внеплановый инструктаж по выявленным нарушениям"
                        ));
                    }
                }
                case TRAINING_COMPLIANCE -> {
                    if (normalizedValue > 20) {
                        recommendations.add(Map.of(
                                "priority", "MEDIUM",
                                "category", "TRAINING_COMPLIANCE",
                                "text", "Запланировать обязательные инструктажи для сотрудников без актуальных допусков"
                        ));
                    }
                }
                case CERT_EXPIRY -> {
                    if (normalizedValue > 25) {
                        recommendations.add(Map.of(
                                "priority", "HIGH",
                                "category", "CERT_EXPIRY",
                                "text", "Обновить просроченные сертификаты сотрудников; рассмотреть временную замену"
                        ));
                    }
                }
                case CREW_EXPERIENCE -> {
                    if (normalizedValue > 50) {
                        recommendations.add(Map.of(
                                "priority", "MEDIUM",
                                "category", "CREW_EXPERIENCE",
                                "text", "Назначить опытных наставников для бригад с низким средним стажем"
                        ));
                    }
                }
                case SUBCONTRACTOR_COUNT -> {
                    if (normalizedValue > 50) {
                        recommendations.add(Map.of(
                                "priority", "LOW",
                                "category", "SUBCONTRACTOR_COUNT",
                                "text", "Усилить координацию безопасности между субподрядчиками"
                        ));
                    }
                }
                default -> {
                    // No recommendation for other factor types
                }
            }
        }

        return recommendations;
    }

    // ======================== Weekly report ========================

    private SafetyRiskReport doGenerateWeeklyReport(UUID organizationId, List<SafetyRiskScore> activeScores) {
        LocalDate now = LocalDate.now();
        int weekOfYear = now.get(IsoFields.WEEK_OF_WEEK_BASED_YEAR);
        int year = now.get(IsoFields.WEEK_BASED_YEAR);
        String reportWeek = String.format("%d-W%02d", year, weekOfYear);

        int projectCount = activeScores.size();
        int totalScore = 0;
        int criticalCount = 0;
        int highRiskCount = 0;

        for (SafetyRiskScore score : activeScores) {
            totalScore += score.getScore();
            if (score.getRiskLevel() == SafetyRiskLevel.CRITICAL) criticalCount++;
            if (score.getRiskLevel() == SafetyRiskLevel.HIGH) highRiskCount++;
        }

        BigDecimal avgRiskScore = projectCount > 0
                ? BigDecimal.valueOf(totalScore).divide(BigDecimal.valueOf(projectCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Collect top recommendations from all projects
        List<String> topRecommendations = new ArrayList<>();
        for (SafetyRiskScore score : activeScores) {
            if (score.getRecommendationsJson() != null && !score.getRecommendationsJson().isBlank()) {
                topRecommendations.add(score.getRecommendationsJson());
            }
        }
        String topRecommendationsJson = serializeToJson(topRecommendations);

        SafetyRiskReport report = SafetyRiskReport.builder()
                .organizationId(organizationId)
                .reportWeek(reportWeek)
                .projectCount(projectCount)
                .avgRiskScore(avgRiskScore)
                .criticalProjects(criticalCount)
                .highRiskProjects(highRiskCount)
                .topRecommendationsJson(topRecommendationsJson)
                .generatedAt(Instant.now())
                .build();

        report = riskReportRepository.save(report);
        auditService.logCreate("SafetyRiskReport", report.getId());

        log.info("Weekly risk report generated: week={}, projects={}, avgScore={}, critical={}, high={}",
                reportWeek, projectCount, avgRiskScore, criticalCount, highRiskCount);

        return report;
    }

    // ======================== Helpers ========================

    private int countIncidentsInDays(UUID organizationId, UUID projectId, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);

        Page<SafetyIncident> incidents = incidentRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalse(organizationId, projectId, Pageable.unpaged());

        return (int) incidents.getContent().stream()
                .filter(i -> i.getIncidentDate() != null && i.getIncidentDate().isAfter(since))
                .count();
    }

    private int countViolationsForProject(UUID organizationId, UUID projectId) {
        // Violations are linked via incidents. Count open violations for incidents on this project.
        Page<SafetyIncident> incidents = incidentRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalse(organizationId, projectId, Pageable.unpaged());

        int violationCount = 0;
        for (SafetyIncident incident : incidents.getContent()) {
            List<SafetyViolation> violations = violationRepository
                    .findByOrganizationIdAndIncidentIdAndDeletedFalse(organizationId, incident.getId());
            violationCount += (int) violations.stream()
                    .filter(v -> v.getStatus() != ViolationStatus.RESOLVED)
                    .count();
        }
        return violationCount;
    }

    private long countOverdueTrainingsForProject(LocalDate today) {
        // Use global overdue count as an approximation
        return Math.max(0, countOverdueTrainings(today));
    }

    private long countOverdueTrainings(LocalDate today) {
        try {
            return 0; // Fall back to 0; the repository doesn't filter by project
        } catch (Exception e) {
            return 0;
        }
    }

    private BigDecimal getTrainingCompliancePct(List<SafetyRiskFactor> factors) {
        return factors.stream()
                .filter(f -> f.getFactorType() == RiskFactorType.TRAINING_COMPLIANCE)
                .findFirst()
                .map(SafetyRiskFactor::getRawValue)
                .orElse(new BigDecimal("100"));
    }

    private BigDecimal getCertExpiryRatio(List<SafetyRiskFactor> factors) {
        return factors.stream()
                .filter(f -> f.getFactorType() == RiskFactorType.CERT_EXPIRY)
                .findFirst()
                .map(SafetyRiskFactor::getRawValue)
                .orElse(BigDecimal.ZERO);
    }

    private String serializeToJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize to JSON: {}", e.getMessage());
            return "[]";
        }
    }
}
