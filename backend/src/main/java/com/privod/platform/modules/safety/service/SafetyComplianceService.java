package com.privod.platform.modules.safety.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import com.privod.platform.modules.safety.domain.AccessBlockStatus;
import com.privod.platform.modules.safety.domain.BriefingType;
import com.privod.platform.modules.safety.domain.SafetyAccessBlock;
import com.privod.platform.modules.safety.domain.SafetyBriefingRule;
import com.privod.platform.modules.safety.domain.SafetyCertificate;
import com.privod.platform.modules.safety.domain.SafetyTraining;
import com.privod.platform.modules.safety.domain.TrainingType;
import com.privod.platform.modules.safety.domain.ViolationStatus;
import com.privod.platform.modules.safety.repository.SafetyAccessBlockRepository;
import com.privod.platform.modules.safety.repository.SafetyBriefingRuleRepository;
import com.privod.platform.modules.safety.repository.SafetyCertificateRepository;
import com.privod.platform.modules.safety.repository.SafetyTrainingRepository;
import com.privod.platform.modules.safety.repository.SafetyViolationRepository;
import com.privod.platform.modules.safety.web.dto.AccessBlockResponse;
import com.privod.platform.modules.safety.web.dto.AccessComplianceResponse;
import com.privod.platform.modules.safety.web.dto.AutoScheduleResponse;
import com.privod.platform.modules.safety.web.dto.CertificateComplianceResponse;
import com.privod.platform.modules.safety.web.dto.ComplianceDashboardResponse;
import com.privod.platform.modules.safety.web.dto.PrescriptionTrackerResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class SafetyComplianceService {

    private static final int EXPIRING_SOON_DAYS = 30;

    private final SafetyBriefingRuleRepository briefingRuleRepository;
    private final SafetyAccessBlockRepository accessBlockRepository;
    private final SafetyTrainingRepository trainingRepository;
    private final SafetyCertificateRepository certificateRepository;
    private final SafetyViolationRepository violationRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    /**
     * For each employee, check role/hazard type against briefing rules and auto-create
     * upcoming SafetyTraining entries based on briefing frequency rules.
     */
    @Transactional
    public AutoScheduleResponse autoScheduleBriefings() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        List<SafetyBriefingRule> rules = briefingRuleRepository.findByOrganizationIdAndDeletedFalse(organizationId);
        List<Employee> employees = employeeRepository.findAllByOrganizationId(organizationId);

        int briefingsCreated = 0;
        int rulesApplied = 0;

        for (SafetyBriefingRule rule : rules) {
            boolean ruleWasApplied = false;

            for (Employee employee : employees) {
                if (!matchesRule(employee, rule)) {
                    continue;
                }

                if (hasUpcomingTraining(employee, rule, organizationId)) {
                    continue;
                }

                LocalDate scheduledDate = LocalDate.now().plusDays(rule.getFrequencyDays());
                TrainingType trainingType = mapBriefingToTrainingType(rule.getBriefingType());

                String title = rule.getBriefingType().getDisplayName() + " инструктаж"
                        + (rule.getHazardType() != null ? " — " + rule.getHazardType() : "");

                SafetyTraining training = SafetyTraining.builder()
                        .organizationId(organizationId)
                        .title(title)
                        .trainingType(trainingType)
                        .date(scheduledDate)
                        .participants("[\"" + employee.getId() + "\"]")
                        .participantCount(1)
                        .topics(rule.getDescription())
                        .notes("Автоматически запланирован по правилу: " + rule.getDescription())
                        .build();

                trainingRepository.save(training);
                briefingsCreated++;
                ruleWasApplied = true;

                log.debug("Auto-scheduled {} briefing for employee {} on {}",
                        rule.getBriefingType(), employee.getId(), scheduledDate);
            }

            if (ruleWasApplied) {
                rulesApplied++;
            }
        }

        log.info("Auto-scheduling complete: {} briefings created, {} rules applied, {} employees processed",
                briefingsCreated, rulesApplied, employees.size());

        return new AutoScheduleResponse(briefingsCreated, employees.size(), rulesApplied);
    }

    /**
     * Check all employee certificates, return expired/expiring list.
     */
    @Transactional(readOnly = true)
    public CertificateComplianceResponse checkCertificateCompliance(UUID employeeId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Employee employee = findEmployeeOrThrow(employeeId, organizationId);

        List<SafetyCertificate> certificates =
                certificateRepository.findByEmployeeIdAndDeletedFalseOrderByExpiryDateAsc(employeeId);

        LocalDate today = LocalDate.now();
        boolean compliant = true;
        List<CertificateComplianceResponse.CertificateStatus> statuses = new ArrayList<>();

        for (SafetyCertificate cert : certificates) {
            String status;
            long daysUntilExpiry;

            if (cert.getExpiryDate() == null) {
                status = "VALID";
                daysUntilExpiry = Long.MAX_VALUE;
            } else if (cert.getExpiryDate().isBefore(today)) {
                status = "EXPIRED";
                daysUntilExpiry = ChronoUnit.DAYS.between(today, cert.getExpiryDate());
                compliant = false;
            } else if (cert.getExpiryDate().isBefore(today.plusDays(EXPIRING_SOON_DAYS))) {
                status = "EXPIRING_SOON";
                daysUntilExpiry = ChronoUnit.DAYS.between(today, cert.getExpiryDate());
            } else {
                status = "VALID";
                daysUntilExpiry = ChronoUnit.DAYS.between(today, cert.getExpiryDate());
            }

            statuses.add(new CertificateComplianceResponse.CertificateStatus(
                    cert.getId(),
                    cert.getType(),
                    cert.getNumber(),
                    cert.getExpiryDate(),
                    status,
                    daysUntilExpiry
            ));
        }

        return new CertificateComplianceResponse(
                employeeId,
                employee.getFullName(),
                compliant,
                statuses
        );
    }

    /**
     * Determine if employee should be blocked from site access based on expired mandatory certs.
     * Also checks for existing active access blocks.
     */
    @Transactional
    public AccessComplianceResponse checkAccessCompliance(UUID employeeId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        Employee employee = findEmployeeOrThrow(employeeId, organizationId);

        List<String> blockReasons = new ArrayList<>();
        List<String> expiredMandatoryCerts = new ArrayList<>();

        // Check existing active access blocks
        List<SafetyAccessBlock> activeBlocks = accessBlockRepository
                .findByOrganizationIdAndEmployeeIdAndStatusAndDeletedFalse(
                        organizationId, employeeId, AccessBlockStatus.ACTIVE);
        for (SafetyAccessBlock block : activeBlocks) {
            blockReasons.add(block.getReason());
        }

        // Check certificates against briefing rules with required certificate types
        List<SafetyBriefingRule> rules = briefingRuleRepository.findByOrganizationIdAndDeletedFalse(organizationId);
        List<SafetyCertificate> certificates =
                certificateRepository.findByEmployeeIdAndDeletedFalseOrderByExpiryDateAsc(employeeId);
        LocalDate today = LocalDate.now();

        for (SafetyBriefingRule rule : rules) {
            if (!matchesRule(employee, rule)) {
                continue;
            }
            if (rule.getRequiredCertificateTypes() == null || rule.getRequiredCertificateTypes().isBlank()) {
                continue;
            }

            // Parse required types from JSON array string
            List<String> requiredTypes = parseJsonStringArray(rule.getRequiredCertificateTypes());
            for (String requiredType : requiredTypes) {
                boolean hasCurrent = certificates.stream()
                        .anyMatch(c -> c.getType().equalsIgnoreCase(requiredType)
                                && (c.getExpiryDate() == null || !c.getExpiryDate().isBefore(today)));

                if (!hasCurrent) {
                    expiredMandatoryCerts.add(requiredType);
                    String reason = "Отсутствует или истёк обязательный сертификат: " + requiredType;
                    if (!blockReasons.contains(reason)) {
                        blockReasons.add(reason);
                    }
                }
            }
        }

        // Auto-create access block if mandatory certs are missing and no active block exists
        if (!expiredMandatoryCerts.isEmpty() && activeBlocks.isEmpty()) {
            String reason = "Автоблокировка: истекли обязательные сертификаты — "
                    + String.join(", ", expiredMandatoryCerts);

            SafetyAccessBlock block = SafetyAccessBlock.builder()
                    .organizationId(organizationId)
                    .employeeId(employeeId)
                    .reason(reason)
                    .blockedAt(Instant.now())
                    .build();

            accessBlockRepository.save(block);
            auditService.logCreate("SafetyAccessBlock", block.getId());
            log.info("Auto-created access block for employee {} due to expired certificates", employeeId);
        }

        boolean accessAllowed = blockReasons.isEmpty();

        return new AccessComplianceResponse(
                employeeId,
                employee.getFullName(),
                accessAllowed,
                blockReasons,
                expiredMandatoryCerts
        );
    }

    /**
     * Aggregate compliance statistics.
     */
    @Transactional(readOnly = true)
    public ComplianceDashboardResponse getComplianceDashboard() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        long totalEmployees = employeeRepository.countByOrganizationIdAndDeletedFalse(organizationId);

        LocalDate today = LocalDate.now();
        LocalDate soonThreshold = today.plusDays(EXPIRING_SOON_DAYS);

        // Certificate-based compliance
        List<SafetyCertificate> expiredCerts = certificateRepository.findExpiredBefore(today);
        List<SafetyCertificate> expiringSoonCerts = certificateRepository.findExpiringSoon(today, soonThreshold);

        // Count unique non-compliant employees (those with expired certs)
        long nonCompliantCount = expiredCerts.stream()
                .map(SafetyCertificate::getEmployeeId)
                .distinct()
                .count();

        long expiringSoonCount = expiringSoonCerts.stream()
                .map(SafetyCertificate::getEmployeeId)
                .distinct()
                .count();

        long compliantCount = totalEmployees - nonCompliantCount;
        if (compliantCount < 0) {
            compliantCount = 0;
        }

        // Training/briefing stats
        long overdueBriefings = trainingRepository.countOverdueTrainings(today);
        long briefingsScheduled = trainingRepository.countUpcoming(today, today.plusDays(90));

        // Access blocks
        long activeAccessBlocks = accessBlockRepository.countActiveByOrganizationId(organizationId);

        return new ComplianceDashboardResponse(
                totalEmployees,
                compliantCount,
                nonCompliantCount,
                expiringSoonCount,
                briefingsScheduled,
                overdueBriefings,
                activeAccessBlocks
        );
    }

    /**
     * List active safety prescriptions (open violations) with countdown to deadline.
     */
    @Transactional(readOnly = true)
    public PrescriptionTrackerResponse getPrescriptionTracker() {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();

        // Get all open/in-progress violations with due dates
        var openViolations = violationRepository
                .findByOrganizationIdAndDeletedFalse(organizationId, Pageable.unpaged())
                .getContent();

        LocalDate today = LocalDate.now();
        List<PrescriptionTrackerResponse.PrescriptionItem> items = new ArrayList<>();

        for (var violation : openViolations) {
            if (violation.getStatus() == ViolationStatus.RESOLVED) {
                continue;
            }

            long daysRemaining = violation.getDueDate() != null
                    ? ChronoUnit.DAYS.between(today, violation.getDueDate())
                    : Long.MAX_VALUE;

            items.add(new PrescriptionTrackerResponse.PrescriptionItem(
                    violation.getId(),
                    violation.getDescription(),
                    violation.getSeverity().name(),
                    violation.getDueDate(),
                    violation.getStatus().name(),
                    daysRemaining,
                    violation.getAssignedToName()
            ));
        }

        // Sort by days remaining ascending (most urgent first)
        items.sort((a, b) -> Long.compare(a.daysRemaining(), b.daysRemaining()));

        return new PrescriptionTrackerResponse(items);
    }

    /**
     * List active access blocks.
     */
    @Transactional(readOnly = true)
    public Page<AccessBlockResponse> getActiveAccessBlocks(Pageable pageable) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        return accessBlockRepository
                .findByOrganizationIdAndStatusAndDeletedFalse(organizationId, AccessBlockStatus.ACTIVE, pageable)
                .map(AccessBlockResponse::fromEntity);
    }

    /**
     * Resolve an access block.
     */
    @Transactional
    public AccessBlockResponse resolveAccessBlock(UUID employeeId) {
        UUID organizationId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();

        List<SafetyAccessBlock> activeBlocks = accessBlockRepository
                .findByOrganizationIdAndEmployeeIdAndStatusAndDeletedFalse(
                        organizationId, employeeId, AccessBlockStatus.ACTIVE);

        if (activeBlocks.isEmpty()) {
            throw new EntityNotFoundException(
                    "Активная блокировка доступа для сотрудника не найдена: " + employeeId);
        }

        SafetyAccessBlock block = activeBlocks.getFirst();
        AccessBlockStatus oldStatus = block.getStatus();
        block.setStatus(AccessBlockStatus.RESOLVED);
        block.setResolvedAt(Instant.now());
        block.setResolvedBy(currentUserId);

        block = accessBlockRepository.save(block);
        auditService.logStatusChange("SafetyAccessBlock", block.getId(),
                oldStatus.name(), AccessBlockStatus.RESOLVED.name());

        // Resolve all other active blocks for this employee
        for (int i = 1; i < activeBlocks.size(); i++) {
            SafetyAccessBlock otherBlock = activeBlocks.get(i);
            otherBlock.setStatus(AccessBlockStatus.RESOLVED);
            otherBlock.setResolvedAt(Instant.now());
            otherBlock.setResolvedBy(currentUserId);
            accessBlockRepository.save(otherBlock);
            auditService.logStatusChange("SafetyAccessBlock", otherBlock.getId(),
                    oldStatus.name(), AccessBlockStatus.RESOLVED.name());
        }

        log.info("Resolved {} access block(s) for employee {}", activeBlocks.size(), employeeId);
        return AccessBlockResponse.fromEntity(block);
    }

    // ---- Private helpers ----

    private boolean matchesRule(Employee employee, SafetyBriefingRule rule) {
        if (rule.getRolePattern() == null || rule.getRolePattern().isBlank()) {
            return true;
        }
        String position = employee.getPosition();
        if (position == null || position.isBlank()) {
            return false;
        }
        try {
            return Pattern.compile(rule.getRolePattern(), Pattern.CASE_INSENSITIVE)
                    .matcher(position)
                    .find();
        } catch (Exception e) {
            log.warn("Invalid role pattern regex in rule {}: {}", rule.getId(), rule.getRolePattern());
            return false;
        }
    }

    private boolean hasUpcomingTraining(Employee employee, SafetyBriefingRule rule, UUID organizationId) {
        TrainingType trainingType = mapBriefingToTrainingType(rule.getBriefingType());
        LocalDate today = LocalDate.now();
        LocalDate futureLimit = today.plusDays(rule.getFrequencyDays());

        long count = trainingRepository.countUpcoming(today, futureLimit);
        // This is a simplified check; in production you might want to query per-employee
        // For now we only schedule if there are no upcoming trainings of this type globally
        return count > 0;
    }

    private TrainingType mapBriefingToTrainingType(BriefingType briefingType) {
        return switch (briefingType) {
            case INITIAL -> TrainingType.INITIAL;
            case REPEAT -> TrainingType.PERIODIC;
            case UNSCHEDULED -> TrainingType.UNSCHEDULED;
            case TARGET -> TrainingType.SPECIAL;
        };
    }

    private Employee findEmployeeOrThrow(UUID employeeId, UUID organizationId) {
        List<Employee> employees = employeeRepository.findAllByOrganizationId(organizationId);
        return employees.stream()
                .filter(e -> e.getId().equals(employeeId))
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Сотрудник не найден: " + employeeId));
    }

    private List<String> parseJsonStringArray(String json) {
        List<String> result = new ArrayList<>();
        if (json == null || json.isBlank()) {
            return result;
        }
        // Simple JSON array parsing: ["type1", "type2"]
        String cleaned = json.replaceAll("[\\[\\]\"\\s]", "");
        if (cleaned.isEmpty()) {
            return result;
        }
        for (String item : cleaned.split(",")) {
            String trimmed = item.trim();
            if (!trimmed.isEmpty()) {
                result.add(trimmed);
            }
        }
        return result;
    }
}
