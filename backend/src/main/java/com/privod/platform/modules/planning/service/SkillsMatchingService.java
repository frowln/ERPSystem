package com.privod.platform.modules.planning.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.domain.EmployeeStatus;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import com.privod.platform.modules.planning.domain.AllocationScenario;
import com.privod.platform.modules.planning.domain.EmployeeSkill;
import com.privod.platform.modules.planning.domain.MultiProjectAllocation;
import com.privod.platform.modules.planning.domain.ProjectSkillRequirement;
import com.privod.platform.modules.planning.repository.AllocationScenarioRepository;
import com.privod.platform.modules.planning.repository.EmployeeSkillRepository;
import com.privod.platform.modules.planning.repository.MultiProjectAllocationRepository;
import com.privod.platform.modules.planning.repository.ProjectSkillRequirementRepository;
import com.privod.platform.modules.planning.web.dto.AllocationScenarioResponse;
import com.privod.platform.modules.planning.web.dto.CandidateSuggestionResponse;
import com.privod.platform.modules.planning.web.dto.CertComplianceCheckResponse;
import com.privod.platform.modules.planning.web.dto.CreateEmployeeSkillRequest;
import com.privod.platform.modules.planning.web.dto.CreateProjectSkillRequirementRequest;
import com.privod.platform.modules.planning.web.dto.EmployeeSkillResponse;
import com.privod.platform.modules.planning.web.dto.ProjectSkillRequirementResponse;
import com.privod.platform.modules.planning.web.dto.WhatIfScenarioRequest;
import com.privod.platform.modules.planning.web.dto.WhatIfScenarioResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class SkillsMatchingService {

    private final EmployeeSkillRepository employeeSkillRepository;
    private final ProjectSkillRequirementRepository requirementRepository;
    private final AllocationScenarioRepository scenarioRepository;
    private final MultiProjectAllocationRepository allocationRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    // ===================== CRUD: Employee Skills =====================

    @Transactional
    public EmployeeSkillResponse addEmployeeSkill(CreateEmployeeSkillRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        EmployeeSkill skill = EmployeeSkill.builder()
                .organizationId(orgId)
                .employeeId(request.employeeId())
                .skillName(request.skillName())
                .skillCategory(request.skillCategory())
                .proficiencyLevel(request.proficiencyLevel())
                .certifiedUntil(request.certifiedUntil())
                .certificationNumber(request.certificationNumber())
                .notes(request.notes())
                .build();

        skill = employeeSkillRepository.save(skill);
        auditService.logCreate("EmployeeSkill", skill.getId());

        log.info("Навык сотрудника добавлен: {} -> {} ({})",
                request.employeeId(), request.skillName(), skill.getId());

        return EmployeeSkillResponse.fromEntity(skill);
    }

    @Transactional(readOnly = true)
    public List<EmployeeSkillResponse> getEmployeeSkills(UUID employeeId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return employeeSkillRepository.findByOrganizationIdAndEmployeeIdAndDeletedFalse(orgId, employeeId)
                .stream()
                .map(EmployeeSkillResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void removeEmployeeSkill(UUID skillId) {
        EmployeeSkill skill = employeeSkillRepository.findById(skillId)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Навык сотрудника не найден: " + skillId));
        skill.softDelete();
        employeeSkillRepository.save(skill);
        auditService.logDelete("EmployeeSkill", skillId);
        log.info("Навык сотрудника удалён: {}", skillId);
    }

    // ===================== CRUD: Project Skill Requirements =====================

    @Transactional
    public ProjectSkillRequirementResponse addProjectRequirement(CreateProjectSkillRequirementRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        ProjectSkillRequirement req = ProjectSkillRequirement.builder()
                .organizationId(orgId)
                .projectId(request.projectId())
                .skillName(request.skillName())
                .skillCategory(request.skillCategory())
                .minimumProficiency(request.minimumProficiency())
                .requiredCount(request.requiredCount())
                .isMandatory(request.isMandatory())
                .build();

        req = requirementRepository.save(req);
        auditService.logCreate("ProjectSkillRequirement", req.getId());

        log.info("Требование к навыку проекта добавлено: проект {} -> {} ({})",
                request.projectId(), request.skillName(), req.getId());

        return ProjectSkillRequirementResponse.fromEntity(req);
    }

    @Transactional(readOnly = true)
    public List<ProjectSkillRequirementResponse> getProjectRequirements(UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return requirementRepository.findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId)
                .stream()
                .map(ProjectSkillRequirementResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void removeProjectRequirement(UUID requirementId) {
        ProjectSkillRequirement req = requirementRepository.findById(requirementId)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Требование к навыку проекта не найдено: " + requirementId));
        req.softDelete();
        requirementRepository.save(req);
        auditService.logDelete("ProjectSkillRequirement", requirementId);
        log.info("Требование к навыку проекта удалено: {}", requirementId);
    }

    // ===================== Suggest Candidates =====================

    @Transactional(readOnly = true)
    public List<CandidateSuggestionResponse> suggestCandidates(UUID projectId, int maxResults) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // 1. Get project skill requirements
        List<ProjectSkillRequirement> requirements = requirementRepository
                .findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId);

        if (requirements.isEmpty()) {
            return List.of();
        }

        // 2. Get all active employees in the organization
        List<Employee> employees = employeeRepository.findAllByOrganizationId(orgId).stream()
                .filter(e -> e.getStatus() == EmployeeStatus.ACTIVE)
                .toList();

        // 3. Get all skills in the organization for efficient lookup
        List<EmployeeSkill> allSkills = employeeSkillRepository.findByOrganizationIdAndDeletedFalse(orgId);
        Map<UUID, List<EmployeeSkill>> skillsByEmployee = allSkills.stream()
                .collect(Collectors.groupingBy(EmployeeSkill::getEmployeeId));

        // 4. Get current allocations for all employees
        LocalDate now = LocalDate.now();
        List<MultiProjectAllocation> currentAllocations = allocationRepository.findByDateRange(orgId, now, now);
        Map<UUID, Integer> allocationByEmployee = new HashMap<>();
        for (MultiProjectAllocation alloc : currentAllocations) {
            allocationByEmployee.merge(alloc.getResourceId(), alloc.getAllocationPercent(), Integer::sum);
        }

        // 5. Score each employee
        List<CandidateSuggestionResponse> candidates = new ArrayList<>();

        for (Employee employee : employees) {
            List<EmployeeSkill> empSkills = skillsByEmployee.getOrDefault(employee.getId(), List.of());
            int currentAlloc = allocationByEmployee.getOrDefault(employee.getId(), 0);

            // Calculate skill match
            List<CandidateSuggestionResponse.SkillMatch> skillMatches = new ArrayList<>();
            List<String> certWarnings = new ArrayList<>();
            int totalScore = 0;
            int totalWeight = 0;
            boolean allMandatoriesMet = true;

            for (ProjectSkillRequirement req : requirements) {
                int weight = Boolean.TRUE.equals(req.getIsMandatory()) ? 2 : 1;
                totalWeight += weight;

                // Find matching skill for this employee
                EmployeeSkill matchingSkill = empSkills.stream()
                        .filter(s -> s.getSkillName().equalsIgnoreCase(req.getSkillName()))
                        .findFirst()
                        .orElse(null);

                if (matchingSkill == null) {
                    // No skill match
                    skillMatches.add(new CandidateSuggestionResponse.SkillMatch(
                            req.getSkillName(), req.getMinimumProficiency(), 0, false));
                    if (Boolean.TRUE.equals(req.getIsMandatory())) {
                        allMandatoriesMet = false;
                    }
                    continue;
                }

                boolean meetsLevel = matchingSkill.getProficiencyLevel() >= req.getMinimumProficiency();
                boolean isCertified = matchingSkill.getCertifiedUntil() == null
                        || !matchingSkill.getCertifiedUntil().isBefore(now);

                skillMatches.add(new CandidateSuggestionResponse.SkillMatch(
                        req.getSkillName(),
                        req.getMinimumProficiency(),
                        matchingSkill.getProficiencyLevel(),
                        isCertified));

                if (meetsLevel) {
                    // Base score for meeting the requirement
                    int skillScore = weight;
                    // Bonus for exceeding minimum proficiency (up to +weight)
                    int excess = matchingSkill.getProficiencyLevel() - req.getMinimumProficiency();
                    if (excess > 0) {
                        skillScore += Math.min(excess, 2) * weight; // max 2 levels bonus
                    }
                    totalScore += skillScore;
                } else {
                    if (Boolean.TRUE.equals(req.getIsMandatory())) {
                        allMandatoriesMet = false;
                    }
                }

                // Check certification warnings
                if (matchingSkill.getCertifiedUntil() != null) {
                    if (matchingSkill.getCertifiedUntil().isBefore(now)) {
                        certWarnings.add(String.format("Сертификат '%s' (№%s) истёк %s",
                                req.getSkillName(),
                                matchingSkill.getCertificationNumber() != null
                                        ? matchingSkill.getCertificationNumber() : "—",
                                matchingSkill.getCertifiedUntil()));
                    } else if (matchingSkill.getCertifiedUntil().isBefore(now.plusDays(30))) {
                        certWarnings.add(String.format("Сертификат '%s' (№%s) истекает %s",
                                req.getSkillName(),
                                matchingSkill.getCertificationNumber() != null
                                        ? matchingSkill.getCertificationNumber() : "—",
                                matchingSkill.getCertifiedUntil()));
                    }
                }
            }

            // Normalize score to 0-100
            // Max possible score per requirement: weight * 3 (1 base + 2 bonus)
            int maxPossible = totalWeight * 3;
            int matchScore = maxPossible > 0 ? Math.min(100, (totalScore * 100) / maxPossible) : 0;

            // Availability penalty: employees above 80% allocation get reduced score
            if (currentAlloc > 80) {
                int penalty = (currentAlloc - 80) * 2; // 2 points per percent over 80
                matchScore = Math.max(0, matchScore - penalty);
            }

            // Only include employees that have at least some skill match
            if (totalScore > 0) {
                candidates.add(new CandidateSuggestionResponse(
                        employee.getId(),
                        employee.getFullName() != null ? employee.getFullName()
                                : (employee.getLastName() + " " + employee.getFirstName()),
                        matchScore,
                        skillMatches,
                        currentAlloc,
                        certWarnings,
                        allMandatoriesMet && certWarnings.stream()
                                .noneMatch(w -> w.contains("истёк"))
                ));
            }
        }

        // Sort by matchScore descending
        candidates.sort((a, b) -> Integer.compare(b.matchScore(), a.matchScore()));

        // Return top N
        if (maxResults > 0 && candidates.size() > maxResults) {
            return candidates.subList(0, maxResults);
        }
        return candidates;
    }

    // ===================== Certification Compliance Check =====================

    @Transactional(readOnly = true)
    public CertComplianceCheckResponse checkCertificationCompliance(UUID employeeId, UUID projectId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        Employee employee = employeeRepository.findById(employeeId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сотрудник не найден: " + employeeId));

        String employeeName = employee.getFullName() != null ? employee.getFullName()
                : (employee.getLastName() + " " + employee.getFirstName());

        // Get mandatory project requirements
        List<ProjectSkillRequirement> mandatoryReqs = requirementRepository
                .findByOrganizationIdAndProjectIdAndIsMandatoryTrueAndDeletedFalse(orgId, projectId);

        // Get employee skills
        List<EmployeeSkill> empSkills = employeeSkillRepository
                .findByOrganizationIdAndEmployeeIdAndDeletedFalse(orgId, employeeId);

        LocalDate now = LocalDate.now();
        List<CertComplianceCheckResponse.CertIssue> issues = new ArrayList<>();
        boolean compliant = true;

        for (ProjectSkillRequirement req : mandatoryReqs) {
            EmployeeSkill matchingSkill = empSkills.stream()
                    .filter(s -> s.getSkillName().equalsIgnoreCase(req.getSkillName()))
                    .findFirst()
                    .orElse(null);

            if (matchingSkill == null) {
                // Missing skill entirely
                issues.add(new CertComplianceCheckResponse.CertIssue(
                        req.getSkillName(), null, null, "MISSING"));
                compliant = false;
                continue;
            }

            if (matchingSkill.getCertifiedUntil() == null) {
                // Has the skill but no certification date — treat as valid (no expiry)
                issues.add(new CertComplianceCheckResponse.CertIssue(
                        req.getSkillName(),
                        matchingSkill.getCertificationNumber(),
                        null,
                        "VALID"));
                continue;
            }

            if (matchingSkill.getCertifiedUntil().isBefore(now)) {
                issues.add(new CertComplianceCheckResponse.CertIssue(
                        req.getSkillName(),
                        matchingSkill.getCertificationNumber(),
                        matchingSkill.getCertifiedUntil(),
                        "EXPIRED"));
                compliant = false;
            } else if (matchingSkill.getCertifiedUntil().isBefore(now.plusDays(30))) {
                issues.add(new CertComplianceCheckResponse.CertIssue(
                        req.getSkillName(),
                        matchingSkill.getCertificationNumber(),
                        matchingSkill.getCertifiedUntil(),
                        "EXPIRING_SOON"));
                // Expiring soon is still compliant but flagged
            } else {
                issues.add(new CertComplianceCheckResponse.CertIssue(
                        req.getSkillName(),
                        matchingSkill.getCertificationNumber(),
                        matchingSkill.getCertifiedUntil(),
                        "VALID"));
            }
        }

        return new CertComplianceCheckResponse(employeeId, employeeName, compliant, issues);
    }

    // ===================== What-If Scenarios =====================

    @Transactional
    public WhatIfScenarioResponse runWhatIfScenario(WhatIfScenarioRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        LocalDate now = LocalDate.now();

        // 1. Get current allocations for all affected employees
        List<UUID> affectedEmployeeIds = request.changes().stream()
                .map(WhatIfScenarioRequest.AllocationChange::employeeId)
                .distinct()
                .toList();

        // Compute a wide date range covering all proposed changes
        LocalDate minDate = request.changes().stream()
                .map(WhatIfScenarioRequest.AllocationChange::startDate)
                .min(LocalDate::compareTo)
                .orElse(now);
        LocalDate maxDate = request.changes().stream()
                .map(WhatIfScenarioRequest.AllocationChange::endDate)
                .max(LocalDate::compareTo)
                .orElse(now.plusYears(1));

        List<MultiProjectAllocation> existingAllocations = allocationRepository
                .findByDateRange(orgId, minDate, maxDate);

        // Group existing allocations by employee
        Map<UUID, List<MultiProjectAllocation>> allocsByEmployee = existingAllocations.stream()
                .collect(Collectors.groupingBy(MultiProjectAllocation::getResourceId));

        // 2. Simulate changes and detect conflicts
        List<WhatIfScenarioResponse.ConflictItem> conflicts = new ArrayList<>();
        List<String> recommendations = new ArrayList<>();

        // Resolve employee names
        Map<UUID, String> employeeNames = new HashMap<>();
        for (UUID empId : affectedEmployeeIds) {
            employeeRepository.findById(empId)
                    .filter(e -> !e.isDeleted())
                    .ifPresent(e -> employeeNames.put(empId,
                            e.getFullName() != null ? e.getFullName()
                                    : (e.getLastName() + " " + e.getFirstName())));
        }

        for (UUID empId : affectedEmployeeIds) {
            List<MultiProjectAllocation> existing = allocsByEmployee.getOrDefault(empId, List.of());

            // Sum existing allocation percent (at peak — simplified to current date overlap)
            int existingPct = existing.stream()
                    .mapToInt(MultiProjectAllocation::getAllocationPercent)
                    .sum();

            // Sum proposed allocation changes for this employee
            int proposedPct = request.changes().stream()
                    .filter(c -> c.employeeId().equals(empId))
                    .mapToInt(WhatIfScenarioRequest.AllocationChange::allocationPercent)
                    .sum();

            // Subtract any "from" project deallocations (if fromProjectId is specified,
            // assume we're removing that allocation)
            for (WhatIfScenarioRequest.AllocationChange change : request.changes()) {
                if (change.employeeId().equals(empId) && change.fromProjectId() != null) {
                    int removedPct = existing.stream()
                            .filter(a -> a.getProjectId().equals(change.fromProjectId()))
                            .mapToInt(MultiProjectAllocation::getAllocationPercent)
                            .sum();
                    existingPct = Math.max(0, existingPct - removedPct);
                }
            }

            int totalPct = existingPct + proposedPct;
            String empName = employeeNames.getOrDefault(empId, empId.toString().substring(0, 8));

            if (totalPct > 100) {
                conflicts.add(new WhatIfScenarioResponse.ConflictItem(
                        empId, empName,
                        String.format("Сотрудник %s будет перегружен: %d%%", empName, totalPct),
                        totalPct));
                recommendations.add(String.format(
                        "Сотрудник %s будет перегружен на %d%%. Рекомендуется снизить нагрузку на %d%%.",
                        empName, totalPct, totalPct - 100));
            }
        }

        // 3. Calculate coverage score: how well do affected projects' requirements get met
        List<UUID> targetProjectIds = request.changes().stream()
                .map(WhatIfScenarioRequest.AllocationChange::toProjectId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .toList();

        int totalRequirements = 0;
        int metRequirements = 0;

        for (UUID projectId : targetProjectIds) {
            List<ProjectSkillRequirement> reqs = requirementRepository
                    .findByOrganizationIdAndProjectIdAndDeletedFalse(orgId, projectId);

            for (ProjectSkillRequirement req : reqs) {
                totalRequirements++;

                // Check if any proposed employee for this project has the required skill
                List<UUID> proposedEmployees = request.changes().stream()
                        .filter(c -> projectId.equals(c.toProjectId()))
                        .map(WhatIfScenarioRequest.AllocationChange::employeeId)
                        .distinct()
                        .toList();

                // Also count existing allocations for this project
                List<UUID> existingEmployees = existingAllocations.stream()
                        .filter(a -> a.getProjectId().equals(projectId))
                        .map(MultiProjectAllocation::getResourceId)
                        .distinct()
                        .toList();

                List<UUID> allEmployees = new ArrayList<>(existingEmployees);
                for (UUID pEmpId : proposedEmployees) {
                    if (!allEmployees.contains(pEmpId)) {
                        allEmployees.add(pEmpId);
                    }
                }

                // Check how many qualified employees we have
                int qualifiedCount = 0;
                for (UUID eId : allEmployees) {
                    List<EmployeeSkill> skills = employeeSkillRepository
                            .findByOrganizationIdAndEmployeeIdAndDeletedFalse(orgId, eId);
                    boolean hasSkill = skills.stream()
                            .anyMatch(s -> s.getSkillName().equalsIgnoreCase(req.getSkillName())
                                    && s.getProficiencyLevel() >= req.getMinimumProficiency());
                    if (hasSkill) {
                        qualifiedCount++;
                    }
                }

                if (qualifiedCount >= req.getRequiredCount()) {
                    metRequirements++;
                } else {
                    int deficit = req.getRequiredCount() - qualifiedCount;
                    recommendations.add(String.format(
                            "Проекту всё ещё не хватает %d специалиста(ов) с навыком '%s'.",
                            deficit, req.getSkillName()));
                }
            }
        }

        int coverageScore = totalRequirements > 0
                ? (metRequirements * 100) / totalRequirements
                : 100;

        // 4. Save the scenario
        String scenarioDataJson;
        String resultJson;
        try {
            scenarioDataJson = objectMapper.writeValueAsString(request.changes());
            Map<String, Object> resultMap = new HashMap<>();
            resultMap.put("conflicts", conflicts);
            resultMap.put("coverageScore", coverageScore);
            resultMap.put("recommendations", recommendations);
            resultJson = objectMapper.writeValueAsString(resultMap);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Ошибка сериализации сценария", e);
        }

        AllocationScenario scenario = AllocationScenario.builder()
                .organizationId(orgId)
                .name(request.name())
                .description(request.description())
                .scenarioDataJson(scenarioDataJson)
                .resultJson(resultJson)
                .build();

        scenario = scenarioRepository.save(scenario);
        auditService.logCreate("AllocationScenario", scenario.getId());

        log.info("What-if сценарий создан: {} ({})", request.name(), scenario.getId());

        return new WhatIfScenarioResponse(scenario.getId(), conflicts, coverageScore, recommendations);
    }

    // ===================== List Scenarios =====================

    @Transactional(readOnly = true)
    public Page<AllocationScenarioResponse> listScenarios(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return scenarioRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(AllocationScenarioResponse::fromEntity);
    }
}
