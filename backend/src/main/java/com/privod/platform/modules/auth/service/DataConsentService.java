package com.privod.platform.modules.auth.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.auth.web.dto.ConsentResponse;
import com.privod.platform.modules.auth.web.dto.RecordConsentRequest;
import com.privod.platform.modules.compliance.domain.ConsentType;
import com.privod.platform.modules.compliance.domain.DataConsent;
import com.privod.platform.modules.compliance.domain.LegalBasis;
import com.privod.platform.modules.compliance.repository.DataConsentRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Service for recording and querying user consent to personal data processing.
 * Persists consent records to the database (data_consents table) instead of localStorage.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DataConsentService {

    private static final UUID SENTINEL_ORG_ID = new UUID(0L, 0L);

    private final DataConsentRepository consentRepository;
    private final UserRepository userRepository;

    /**
     * Records a consent for the currently authenticated user.
     * IP address and User-Agent are captured from the HTTP request.
     */
    @Transactional
    public ConsentResponse recordConsent(RecordConsentRequest request, HttpServletRequest httpRequest) {
        UUID userId = SecurityUtils.requireCurrentUserId();
        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(SENTINEL_ORG_ID);

        String purpose = resolvePurpose(request.consentType());

        DataConsent consent = DataConsent.builder()
                .organizationId(orgId)
                .userId(userId)
                .consentType(request.consentType())
                .legalBasis(LegalBasis.CONSENT)
                .purpose(purpose)
                .dataCategories(resolveDataCategories(request.consentType()))
                .ipAddress(extractIp(httpRequest))
                .userAgent(httpRequest != null ? httpRequest.getHeader("User-Agent") : null)
                .consentedAt(Instant.now())
                .isActive(true)
                .build();

        consent = consentRepository.save(consent);
        log.info("Consent recorded: type={}, userId={}, id={}", request.consentType(), userId, consent.getId());

        return ConsentResponse.fromEntity(consent);
    }

    /**
     * Records a consent during registration (before the user is fully authenticated).
     */
    @Transactional
    public void recordRegistrationConsent(UUID userId, UUID organizationId, ConsentType consentType) {
        UUID orgId = organizationId != null ? organizationId : SENTINEL_ORG_ID;

        DataConsent consent = DataConsent.builder()
                .organizationId(orgId)
                .userId(userId)
                .consentType(consentType)
                .legalBasis(LegalBasis.CONSENT)
                .purpose(resolvePurpose(consentType))
                .dataCategories(resolveDataCategories(consentType))
                .consentedAt(Instant.now())
                .isActive(true)
                .build();

        consentRepository.save(consent);
        log.info("Registration consent recorded: type={}, userId={}", consentType, userId);
    }

    /**
     * Returns all active consents for the currently authenticated user.
     */
    @Transactional(readOnly = true)
    public List<ConsentResponse> getCurrentUserConsents() {
        UUID userId = SecurityUtils.requireCurrentUserId();
        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(SENTINEL_ORG_ID);

        return consentRepository.findByOrganizationIdAndUserIdAndDeletedFalse(orgId, userId)
                .stream()
                .map(ConsentResponse::fromEntity)
                .toList();
    }

    /**
     * Revokes a specific consent for the currently authenticated user.
     */
    @Transactional
    public ConsentResponse revokeConsent(UUID consentId) {
        UUID userId = SecurityUtils.requireCurrentUserId();

        DataConsent consent = consentRepository.findById(consentId)
                .filter(c -> !c.isDeleted() && c.getUserId().equals(userId))
                .orElseThrow(() -> new EntityNotFoundException("Consent not found: " + consentId));

        consent.revoke();
        consent = consentRepository.save(consent);

        log.info("Consent revoked: id={}, type={}, userId={}", consentId, consent.getConsentType(), userId);
        return ConsentResponse.fromEntity(consent);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private String resolvePurpose(ConsentType type) {
        return switch (type) {
            case PERSONAL_DATA -> "Обработка персональных данных (152-ФЗ)";
            case PRIVACY_POLICY -> "Обработка персональных данных при регистрации (152-ФЗ)";
            case COOKIES -> "Использование файлов cookie для работы платформы";
            case MARKETING -> "Получение маркетинговых и рекламных материалов";
            case SPECIAL_CATEGORY -> "Обработка специальных категорий ПДн";
            case CROSS_BORDER -> "Трансграничная передача персональных данных";
            case BIOMETRIC -> "Обработка биометрических персональных данных";
        };
    }

    private String resolveDataCategories(ConsentType type) {
        return switch (type) {
            case PERSONAL_DATA, PRIVACY_POLICY -> "identification,contact";
            case COOKIES -> "technical,preferences";
            case MARKETING -> "contact,preferences";
            case SPECIAL_CATEGORY -> "special_category";
            case CROSS_BORDER -> "identification,contact";
            case BIOMETRIC -> "biometric";
        };
    }

    private String extractIp(HttpServletRequest request) {
        if (request == null) return null;
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
