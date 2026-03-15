package com.privod.platform.infrastructure.dadata;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
// TODO: Add resilience4j-spring-boot3 dependency to enable circuit breaker
// import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Chekka.ru integration — counterparty reliability / risk scoring.
 * API: https://chekka.ru / https://api.chekka.ru
 * Endpoint: GET /v1/company?inn={inn}  with  Authorization: Bearer {token}
 *
 * Results are cached in-memory for 24 hours to minimise API quota usage.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChekkaService {

    private static final long CACHE_TTL_MS = 24L * 60 * 60 * 1000; // 24 h

    private final RestTemplate restTemplate;

    @Value("${app.chekka.api-key:}")
    private String apiKey;

    @Value("${app.chekka.base-url:https://api.chekka.ru}")
    private String baseUrl;

    /** Simple in-memory cache: INN → (response, fetchedAt) */
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    // ─── Public API ───────────────────────────────────────────────────────────

    // @CircuitBreaker(name = "chekka", fallbackMethod = "fallbackCheckCounterparty")
    public ChekkaResponse checkCounterparty(String inn) {
        if (inn == null || inn.isBlank()) {
            return ChekkaResponse.ofError(inn, "INN is required");
        }

        // Check in-memory cache
        CacheEntry cached = cache.get(inn);
        if (cached != null && (System.currentTimeMillis() - cached.fetchedAt) < CACHE_TTL_MS) {
            log.debug("Chekka cache hit for INN={}", inn);
            return cached.response;
        }

        ChekkaResponse result = fetchFromApi(inn);
        if (result.error() == null) {
            // Only cache successful responses
            cache.put(inn, new CacheEntry(result, System.currentTimeMillis()));
        }
        return result;
    }

    @SuppressWarnings("unused")
    private ChekkaResponse fallbackCheckCounterparty(String inn, Throwable t) {
        log.warn("Circuit breaker OPEN for Chekka (INN={}): {}", inn, t.getMessage());
        return ChekkaResponse.ofError(inn, "Chekka API temporarily unavailable");
    }

    // ─── Private implementation ───────────────────────────────────────────────

    private ChekkaResponse fetchFromApi(String inn) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Chekka API key not configured (chekka.api-key). Returning UNKNOWN risk.");
            return ChekkaResponse.ofError(inn, "Chekka API key not configured");
        }

        // Try primary endpoint: GET /v1/company?inn=…
        String primaryUrl = baseUrl + "/v1/company?inn=" + inn;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("Accept", MediaType.APPLICATION_JSON_VALUE);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<ChekkaApiResponse> resp = restTemplate.exchange(
                    primaryUrl, HttpMethod.GET, entity, ChekkaApiResponse.class);

            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                return mapToResponse(inn, resp.getBody());
            }
            log.warn("Chekka primary endpoint returned status {} for INN={}", resp.getStatusCode(), inn);
        } catch (Exception e) {
            log.warn("Chekka primary endpoint failed for INN={}: {}", inn, e.getMessage());
        }

        // Fallback endpoint: GET /v1/check?inn=…
        String fallbackUrl = baseUrl + "/v1/check?inn=" + inn;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Authorization", "Bearer " + apiKey);
            headers.set("Accept", MediaType.APPLICATION_JSON_VALUE);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<ChekkaApiResponse> resp = restTemplate.exchange(
                    fallbackUrl, HttpMethod.GET, entity, ChekkaApiResponse.class);

            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                return mapToResponse(inn, resp.getBody());
            }
            log.warn("Chekka fallback endpoint returned status {} for INN={}", resp.getStatusCode(), inn);
        } catch (Exception e) {
            log.warn("Chekka fallback endpoint failed for INN={}: {}", inn, e.getMessage());
        }

        // Both endpoints failed — return graceful error
        return ChekkaResponse.ofError(inn, "Chekka API unavailable");
    }

    private ChekkaResponse mapToResponse(String inn, ChekkaApiResponse api) {
        String riskLevel = resolveRiskLevel(api);

        List<String> related = api.getRelatedCompanies() != null
                ? api.getRelatedCompanies()
                : Collections.emptyList();

        ArbitrationInfo arb = api.getArbitration();
        int arbTotal = 0, arbPlaintiff = 0, arbDefendant = 0;
        if (arb != null) {
            arbTotal     = nullToZero(arb.getTotal());
            arbPlaintiff = nullToZero(arb.getAsPlaintiff());
            arbDefendant = nullToZero(arb.getAsDefendant());
        }

        boolean hasBankruptcy = Boolean.TRUE.equals(api.getHasBankruptcy())
                || "BANKRUPT".equalsIgnoreCase(api.getStatus());
        boolean hasDebts = Boolean.TRUE.equals(api.getHasDebts())
                || (api.getDebtAmount() != null && api.getDebtAmount() > 0);

        boolean isActive = api.getIsActive() != null
                ? api.getIsActive()
                : !"LIQUIDATED".equalsIgnoreCase(api.getStatus());

        return new ChekkaResponse(
                inn,
                riskLevel,
                api.getRiskScore(),
                isActive,
                hasBankruptcy,
                hasDebts,
                arbTotal,
                arbPlaintiff,
                arbDefendant,
                related,
                api.getLegalAddress(),
                LocalDateTime.now(),
                null
        );
    }

    private String resolveRiskLevel(ChekkaApiResponse api) {
        if (api.getRiskLevel() != null && !api.getRiskLevel().isBlank()) {
            return api.getRiskLevel().toUpperCase();
        }
        if (api.getRiskScore() != null) {
            int score = api.getRiskScore();
            if (score >= 70) return "HIGH";
            if (score >= 40) return "MEDIUM";
            return "LOW";
        }
        return "UNKNOWN";
    }

    private int nullToZero(Integer v) {
        return v == null ? 0 : v;
    }

    // ─── Cache helper ─────────────────────────────────────────────────────────

    private record CacheEntry(ChekkaResponse response, long fetchedAt) {}

    // ─── API response DTOs ────────────────────────────────────────────────────

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ChekkaApiResponse {

        /** Normalised risk level from Chekka: low / medium / high */
        @JsonProperty("risk_level")
        private String riskLevel;

        /** 0-100 risk score */
        @JsonProperty("risk_score")
        private Integer riskScore;

        @JsonProperty("is_active")
        private Boolean isActive;

        /** ACTIVE / LIQUIDATED / BANKRUPT / etc. */
        private String status;

        @JsonProperty("has_bankruptcy")
        private Boolean hasBankruptcy;

        @JsonProperty("has_debts")
        private Boolean hasDebts;

        @JsonProperty("debt_amount")
        private Double debtAmount;

        private ArbitrationInfo arbitration;

        @JsonProperty("related_companies")
        private List<String> relatedCompanies;

        @JsonProperty("legal_address")
        private String legalAddress;

        // Alternative flat field names some providers use
        @JsonProperty("riskLevel")
        private String riskLevelAlt;

        @JsonProperty("riskScore")
        private Integer riskScoreAlt;

        public String getRiskLevel() {
            return riskLevel != null ? riskLevel : riskLevelAlt;
        }

        public Integer getRiskScore() {
            return riskScore != null ? riskScore : riskScoreAlt;
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class ArbitrationInfo {
        private Integer total;

        @JsonProperty("as_plaintiff")
        private Integer asPlaintiff;

        @JsonProperty("as_defendant")
        private Integer asDefendant;

        // camelCase alternatives
        @JsonProperty("asPlaintiff")
        private Integer asPlaintiffAlt;

        @JsonProperty("asDefendant")
        private Integer asDefendantAlt;

        public Integer getAsPlaintiff() {
            return asPlaintiff != null ? asPlaintiff : asPlaintiffAlt;
        }

        public Integer getAsDefendant() {
            return asDefendant != null ? asDefendant : asDefendantAlt;
        }
    }
}
