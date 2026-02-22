package com.privod.platform.modules.compliance.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.compliance.domain.DataConsent;
import com.privod.platform.modules.compliance.domain.DataSubjectRequest;
import com.privod.platform.modules.compliance.domain.PiiAccessLog;
import com.privod.platform.modules.compliance.domain.PiiAccessType;
import com.privod.platform.modules.compliance.domain.PrivacyPolicy;
import com.privod.platform.modules.compliance.domain.SubjectRequestStatus;
import com.privod.platform.modules.compliance.repository.DataConsentRepository;
import com.privod.platform.modules.compliance.repository.DataSubjectRequestRepository;
import com.privod.platform.modules.compliance.repository.PiiAccessLogRepository;
import com.privod.platform.modules.compliance.repository.PrivacyPolicyRepository;
import com.privod.platform.modules.compliance.web.dto.ComplianceDashboardResponse;
import com.privod.platform.modules.compliance.web.dto.CreateDataConsentRequest;
import com.privod.platform.modules.compliance.web.dto.CreateDataSubjectRequestRequest;
import com.privod.platform.modules.compliance.web.dto.CreatePrivacyPolicyRequest;
import com.privod.platform.modules.compliance.web.dto.DataConsentResponse;
import com.privod.platform.modules.compliance.web.dto.DataSubjectRequestResponse;
import com.privod.platform.modules.compliance.web.dto.PiiAccessLogResponse;
import com.privod.platform.modules.compliance.web.dto.PrivacyPolicyResponse;
import com.privod.platform.modules.compliance.web.dto.ProcessSubjectRequestRequest;
import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Сервис соблюдения требований 152-ФЗ «О персональных данных».
 * <p>
 * Управляет согласиями на обработку ПДн, запросами субъектов,
 * политиками конфиденциальности и журналом доступа к ПДн.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PrivacyComplianceService {

    private static final int DEADLINE_DAYS = 30;

    private final DataConsentRepository consentRepository;
    private final DataSubjectRequestRepository subjectRequestRepository;
    private final PrivacyPolicyRepository policyRepository;
    private final PiiAccessLogRepository piiAccessLogRepository;
    private final EmployeeRepository employeeRepository;
    private final AuditService auditService;

    // ─── Consents (ст. 9 152-ФЗ) ────────────────────────────────────────

    @Transactional
    public DataConsentResponse grantConsent(CreateDataConsentRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        DataConsent consent = DataConsent.builder()
                .organizationId(orgId)
                .userId(userId)
                .consentType(request.consentType())
                .legalBasis(request.legalBasis())
                .purpose(request.purpose())
                .dataCategories(request.dataCategories())
                .retentionDays(request.retentionDays())
                .consentVersion(request.consentVersion() != null ? request.consentVersion() : "1.0")
                .ipAddress(getClientIpAddress())
                .userAgent(getUserAgent())
                .consentedAt(Instant.now())
                .isActive(true)
                .build();

        consent = consentRepository.save(consent);
        auditService.logCreate("DataConsent", consent.getId());

        log.info("Согласие на обработку ПДн создано: тип={}, пользователь={}, id={}",
                consent.getConsentType(), userId, consent.getId());
        return DataConsentResponse.fromEntity(consent);
    }

    @Transactional
    public DataConsentResponse revokeConsent(UUID consentId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        DataConsent consent = consentRepository.findById(consentId)
                .filter(c -> !c.isDeleted() && c.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new EntityNotFoundException(
                        "Согласие на обработку ПДн не найдено: " + consentId));

        String oldStatus = String.valueOf(consent.isActive());
        consent.revoke();
        consent = consentRepository.save(consent);

        auditService.logStatusChange("DataConsent", consent.getId(), oldStatus, "false");
        log.info("Согласие на обработку ПДн отозвано: id={}, пользователь={}",
                consentId, consent.getUserId());
        return DataConsentResponse.fromEntity(consent);
    }

    @Transactional(readOnly = true)
    public List<DataConsentResponse> getUserConsents(UUID userId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return consentRepository.findByOrgAndUser(orgId, userId).stream()
                .map(DataConsentResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<DataConsentResponse> listConsents(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return consentRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(DataConsentResponse::fromEntity);
    }

    // ─── Subject Requests (ст. 14, 20, 21 152-ФЗ) ───────────────────────

    @Transactional
    public DataSubjectRequestResponse createSubjectRequest(CreateDataSubjectRequestRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        Instant now = Instant.now();
        DataSubjectRequest dsr = DataSubjectRequest.builder()
                .organizationId(orgId)
                .userId(userId)
                .requestType(request.requestType())
                .status(SubjectRequestStatus.PENDING)
                .description(request.description())
                .deadlineAt(now.plus(DEADLINE_DAYS, ChronoUnit.DAYS))
                .build();

        dsr = subjectRequestRepository.save(dsr);
        auditService.logCreate("DataSubjectRequest", dsr.getId());

        log.info("Запрос субъекта ПДн создан: тип={}, пользователь={}, срок={}, id={}",
                dsr.getRequestType(), userId, dsr.getDeadlineAt(), dsr.getId());
        return DataSubjectRequestResponse.fromEntity(dsr);
    }

    @Transactional
    public DataSubjectRequestResponse processSubjectRequest(UUID requestId,
                                                             ProcessSubjectRequestRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();

        DataSubjectRequest dsr = subjectRequestRepository.findById(requestId)
                .filter(r -> !r.isDeleted() && r.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new EntityNotFoundException(
                        "Запрос субъекта ПДн не найден: " + requestId));

        String oldStatus = dsr.getStatus().name();
        dsr.setStatus(request.status());
        dsr.setResponseText(request.responseText());
        dsr.setProcessedBy(currentUserId);

        if (request.status() == SubjectRequestStatus.COMPLETED
                || request.status() == SubjectRequestStatus.REJECTED) {
            dsr.setCompletedAt(Instant.now());
        }

        dsr = subjectRequestRepository.save(dsr);
        auditService.logStatusChange("DataSubjectRequest", dsr.getId(),
                oldStatus, request.status().name());

        log.info("Запрос субъекта ПДн обработан: id={}, статус={}", requestId, request.status());
        return DataSubjectRequestResponse.fromEntity(dsr);
    }

    @Transactional(readOnly = true)
    public List<DataSubjectRequestResponse> getOverdueRequests() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return subjectRequestRepository.findOverdue(orgId, Instant.now()).stream()
                .map(DataSubjectRequestResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<DataSubjectRequestResponse> listSubjectRequests(SubjectRequestStatus status,
                                                                  Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        if (status != null) {
            return subjectRequestRepository
                    .findByOrganizationIdAndStatusAndDeletedFalse(orgId, status, pageable)
                    .map(DataSubjectRequestResponse::fromEntity);
        }
        return subjectRequestRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(DataSubjectRequestResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public DataSubjectRequestResponse getSubjectRequest(UUID requestId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        DataSubjectRequest dsr = subjectRequestRepository.findById(requestId)
                .filter(r -> !r.isDeleted() && r.getOrganizationId().equals(orgId))
                .orElseThrow(() -> new EntityNotFoundException(
                        "Запрос субъекта ПДн не найден: " + requestId));
        return DataSubjectRequestResponse.fromEntity(dsr);
    }

    // ─── Data Deletion (ст. 21 152-ФЗ) ──────────────────────────────────

    @Transactional
    public void executeDataDeletion(UUID userId) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID currentUserId = SecurityUtils.requireCurrentUserId();

        log.warn("Выполняется удаление ПДн пользователя: userId={}, инициатор={}",
                userId, currentUserId);

        // Nullify PII fields on Employee
        Optional<Employee> employeeOpt = employeeRepository.findByUserIdAndDeletedFalse(userId);
        if (employeeOpt.isPresent()) {
            Employee employee = employeeOpt.get();
            employee.setPassportNumber(null);
            employee.setInn(null);
            employee.setSnils(null);
            employeeRepository.save(employee);

            logPiiAccess("Employee", employee.getId(), "passportNumber,inn,snils",
                    PiiAccessType.DELETE);
            auditService.logUpdate("Employee", employee.getId(),
                    "pii_fields", "[REDACTED]", "null");

            log.info("ПДн сотрудника удалены: employeeId={}", employee.getId());
        }

        // Mark all consents as revoked
        List<DataConsent> consents = consentRepository
                .findByOrganizationIdAndUserIdAndDeletedFalse(orgId, userId);
        for (DataConsent consent : consents) {
            if (consent.isActive()) {
                consent.revoke();
                consentRepository.save(consent);
            }
        }

        log.info("Удаление ПДн завершено: userId={}, отозвано согласий={}",
                userId, consents.size());
    }

    // ─── Privacy Policies ────────────────────────────────────────────────

    @Transactional
    public PrivacyPolicyResponse createPrivacyPolicy(CreatePrivacyPolicyRequest request) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Deactivate previous current policy
        policyRepository.deactivateCurrentPolicies(orgId);

        PrivacyPolicy policy = PrivacyPolicy.builder()
                .organizationId(orgId)
                .title(request.title())
                .content(request.content())
                .versionNumber(request.versionNumber())
                .effectiveFrom(request.effectiveFrom())
                .effectiveTo(request.effectiveTo())
                .isCurrent(true)
                .approvedBy(request.approvedBy())
                .approvedAt(request.approvedBy() != null ? Instant.now() : null)
                .build();

        policy = policyRepository.save(policy);
        auditService.logCreate("PrivacyPolicy", policy.getId());

        log.info("Политика конфиденциальности создана: версия={}, id={}",
                policy.getVersionNumber(), policy.getId());
        return PrivacyPolicyResponse.fromEntity(policy);
    }

    @Transactional(readOnly = true)
    public PrivacyPolicyResponse getCurrentPolicy() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        PrivacyPolicy policy = policyRepository
                .findByOrganizationIdAndIsCurrentTrueAndDeletedFalse(orgId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Действующая политика конфиденциальности не найдена"));
        return PrivacyPolicyResponse.fromEntity(policy);
    }

    @Transactional(readOnly = true)
    public Page<PrivacyPolicyResponse> listPolicies(Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return policyRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(PrivacyPolicyResponse::fromEntity);
    }

    // ─── PII Access Log ─────────────────────────────────────────────────

    @Transactional
    public void logPiiAccess(String entityType, UUID entityId, String fieldName,
                              PiiAccessType accessType) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        UUID userId = SecurityUtils.requireCurrentUserId();

        PiiAccessLog logEntry = PiiAccessLog.builder()
                .organizationId(orgId)
                .userId(userId)
                .entityType(entityType)
                .entityId(entityId)
                .fieldName(fieldName)
                .accessType(accessType)
                .ipAddress(getClientIpAddress())
                .accessedAt(Instant.now())
                .build();

        piiAccessLogRepository.save(logEntry);
    }

    @Transactional(readOnly = true)
    public Page<PiiAccessLogResponse> getPiiAccessLog(UUID entityId, String entityType,
                                                       UUID userId, Pageable pageable) {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        if (entityType != null && entityId != null) {
            return piiAccessLogRepository
                    .findByOrganizationIdAndEntityTypeAndEntityIdAndDeletedFalse(
                            orgId, entityType, entityId, pageable)
                    .map(PiiAccessLogResponse::fromEntity);
        }
        if (userId != null) {
            return piiAccessLogRepository
                    .findByOrganizationIdAndUserIdAndDeletedFalse(orgId, userId, pageable)
                    .map(PiiAccessLogResponse::fromEntity);
        }
        return piiAccessLogRepository.findByOrganizationIdAndDeletedFalse(orgId, pageable)
                .map(PiiAccessLogResponse::fromEntity);
    }

    // ─── Dashboard ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public ComplianceDashboardResponse getComplianceDashboard() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        Instant now = Instant.now();
        Instant thirtyDaysAgo = now.minus(30, ChronoUnit.DAYS);

        long totalConsents = consentRepository.countByOrganizationIdAndDeletedFalse(orgId);
        long activeConsents = consentRepository.countByOrganizationIdAndIsActiveTrueAndDeletedFalse(orgId);
        long pendingRequests = subjectRequestRepository
                .countByOrganizationIdAndStatusAndDeletedFalse(orgId, SubjectRequestStatus.PENDING);
        long overdueRequests = subjectRequestRepository.findOverdue(orgId, now).size();
        long piiAccessCount30d = piiAccessLogRepository
                .countByOrgAndAccessedAtBetween(orgId, thirtyDaysAgo, now);

        return new ComplianceDashboardResponse(
                totalConsents,
                activeConsents,
                pendingRequests,
                overdueRequests,
                piiAccessCount30d
        );
    }

    // ─── Helpers ─────────────────────────────────────────────────────────

    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String forwarded = request.getHeader("X-Forwarded-For");
                if (forwarded != null && !forwarded.isBlank()) {
                    return forwarded.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            log.debug("Не удалось определить IP-адрес клиента", e);
        }
        return null;
    }

    private String getUserAgent() {
        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                return attrs.getRequest().getHeader("User-Agent");
            }
        } catch (Exception e) {
            log.debug("Не удалось определить User-Agent", e);
        }
        return null;
    }
}
