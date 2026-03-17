package com.privod.platform.infrastructure.dadata;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Checko.ru API integration — full counterparty data from EGRUL, finances, risk flags.
 * API: https://api.checko.ru/v2/company?key={key}&inn={inn}
 * Docs: https://checko.ru/integration/api
 *
 * Results are cached in-memory for 24 hours to minimise API quota usage (100 req/day free).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ChekkaService {

    private static final long CACHE_TTL_MS = 24L * 60 * 60 * 1000; // 24 h

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.chekka.api-key:}")
    private String apiKey;

    @Value("${app.chekka.base-url:https://api.checko.ru}")
    private String baseUrl;

    /** Simple in-memory cache: INN → (response, fetchedAt) */
    private final ConcurrentHashMap<String, CacheEntry> cache = new ConcurrentHashMap<>();

    // ─── Public API ───────────────────────────────────────────────────────────

    public ChekkaResponse checkCounterparty(String inn) {
        if (inn == null || inn.isBlank()) {
            return ChekkaResponse.ofError(inn, "INN is required");
        }

        // Check in-memory cache
        CacheEntry cached = cache.get(inn);
        if (cached != null && (System.currentTimeMillis() - cached.fetchedAt) < CACHE_TTL_MS) {
            log.debug("Checko cache hit for INN={}", inn);
            return cached.response;
        }

        ChekkaResponse result = fetchFromChecko(inn);
        if (result.error() == null) {
            cache.put(inn, new CacheEntry(result, System.currentTimeMillis()));
        }
        return result;
    }

    // ─── Private implementation ───────────────────────────────────────────────

    private ChekkaResponse fetchFromChecko(String inn) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Checko API key not configured (app.chekka.api-key). Returning UNKNOWN risk.");
            return ChekkaResponse.ofError(inn, "Checko API key not configured");
        }

        // Fetch company data
        JsonNode companyData = fetchEndpoint("/v2/company", inn);
        if (companyData == null) {
            return ChekkaResponse.ofError(inn, "Checko API unavailable");
        }

        // Fetch financial data
        JsonNode financeData = fetchEndpoint("/v2/finances", inn);

        return mapToResponse(inn, companyData, financeData);
    }

    private JsonNode fetchEndpoint(String path, String inn) {
        String url = baseUrl + path + "?key=" + apiKey + "&inn=" + inn;
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.set("Accept", MediaType.APPLICATION_JSON_VALUE);
            HttpEntity<Void> entity = new HttpEntity<>(headers);

            ResponseEntity<String> resp = restTemplate.exchange(url, HttpMethod.GET, entity, String.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                return objectMapper.readTree(resp.getBody());
            }
            log.warn("Checko {} returned status {} for INN={}", path, resp.getStatusCode(), inn);
        } catch (Exception e) {
            log.warn("Checko {} failed for INN={}: {}", path, inn, e.getMessage());
        }
        return null;
    }

    private ChekkaResponse mapToResponse(String inn, JsonNode root, JsonNode finRoot) {
        JsonNode data = root.has("data") ? root.get("data") : root;

        // Basic info
        String ogrn = textOrNull(data, "ОГРН");
        String kpp = textOrNull(data, "КПП");
        String okpo = textOrNull(data, "ОКПО");
        String fullName = textOrNull(data, "НаимПолн");
        String shortName = textOrNull(data, "НаимСокр");
        String registrationDate = textOrNull(data, "ДатаРег");

        // Status
        String statusName = null;
        String statusCode = null;
        boolean isActive = true;
        if (data.has("Статус") && data.get("Статус").isObject()) {
            statusName = textOrNull(data.get("Статус"), "Наим");
            statusCode = textOrNull(data.get("Статус"), "Код");
            isActive = !"002".equals(statusCode); // 002 = Ликвидировано
        }

        // Region
        String region = null;
        if (data.has("Регион") && data.get("Регион").isObject()) {
            region = textOrNull(data.get("Регион"), "Наим");
        }

        // Legal address
        String legalAddress = null;
        if (data.has("ЮрАдрес")) {
            JsonNode addr = data.get("ЮрАдрес");
            if (addr.isObject()) {
                legalAddress = textOrNull(addr, "АдресРФ");
            } else if (addr.isTextual()) {
                legalAddress = addr.asText();
            }
        }

        // Main OKVED
        String mainOkved = null;
        if (data.has("ОКВЭД") && data.get("ОКВЭД").isObject()) {
            String code = textOrNull(data.get("ОКВЭД"), "Код");
            String name = textOrNull(data.get("ОКВЭД"), "Наим");
            mainOkved = code != null && name != null ? code + " — " + name : (code != null ? code : name);
        }

        // Additional OKVEDs
        List<ChekkaResponse.OkvedEntry> additionalOkveds = new ArrayList<>();
        if (data.has("ОКВЭДДоп") && data.get("ОКВЭДДоп").isArray()) {
            for (JsonNode okved : data.get("ОКВЭДДоп")) {
                additionalOkveds.add(new ChekkaResponse.OkvedEntry(
                        textOrNull(okved, "Код"),
                        textOrNull(okved, "Наим")));
            }
        }

        // Capital
        String capitalType = null;
        Long capitalAmount = null;
        if (data.has("УстКап") && data.get("УстКап").isObject()) {
            capitalType = textOrNull(data.get("УстКап"), "Тип");
            JsonNode sum = data.get("УстКап").get("Сумма");
            if (sum != null && !sum.isNull()) capitalAmount = sum.asLong();
        }

        // Directors
        List<ChekkaResponse.Director> directors = new ArrayList<>();
        if (data.has("Руковод") && data.get("Руковод").isArray()) {
            for (JsonNode d : data.get("Руковод")) {
                directors.add(new ChekkaResponse.Director(
                        textOrNull(d, "ФИО"),
                        textOrNull(d, "НаимДолжн"),
                        textOrNull(d, "ИНН"),
                        boolOrFalse(d, "МассРуковод"),
                        boolOrFalse(d, "ДисквЛицо")));
            }
        }

        // Founders
        List<ChekkaResponse.Founder> founders = new ArrayList<>();
        if (data.has("Учред") && data.get("Учред").isObject()) {
            // Учред can have ФЛ (physical), ЮЛ (legal), etc.
            for (String key : List.of("ФЛ", "ЮЛ", "РФ", "МО", "ПИФ")) {
                if (data.get("Учред").has(key) && data.get("Учред").get(key).isArray()) {
                    for (JsonNode f : data.get("Учред").get(key)) {
                        String fName = textOrNull(f, "ФИО");
                        if (fName == null) fName = textOrNull(f, "НаимПолн");
                        if (fName == null) fName = textOrNull(f, "Наим");
                        String fInn = textOrNull(f, "ИНН");
                        JsonNode shareNode = f.get("ДоляПроц");
                        String share = shareNode != null && !shareNode.isNull() ? shareNode.asText() + "%" : null;
                        founders.add(new ChekkaResponse.Founder(fName, fInn, share));
                    }
                }
            }
        }

        // Employee count
        Integer employeeCount = intOrNull(data, "СЧР");
        Integer employeeCountYear = intOrNull(data, "СЧРГод");

        // Contacts
        String checkoPhone = null;
        String checkoEmail = null;
        if (data.has("Контакты") && data.get("Контакты").isObject()) {
            JsonNode contacts = data.get("Контакты");
            if (contacts.has("Тел") && contacts.get("Тел").isArray() && !contacts.get("Тел").isEmpty()) {
                checkoPhone = contacts.get("Тел").get(0).asText();
            }
            if (contacts.has("Емэйл") && contacts.get("Емэйл").isArray() && !contacts.get("Емэйл").isEmpty()) {
                checkoEmail = contacts.get("Емэйл").get(0).asText();
            }
        }

        // Tax authority
        String taxAuthorityName = null;
        String taxAuthorityCode = null;
        if (data.has("ТекФНС") && data.get("ТекФНС").isObject()) {
            taxAuthorityName = textOrNull(data.get("ТекФНС"), "НаимОрг");
            taxAuthorityCode = textOrNull(data.get("ТекФНС"), "КодОрг");
        }

        // Licenses
        List<ChekkaResponse.LicenseInfo> licenses = new ArrayList<>();
        if (data.has("Лиценз") && data.get("Лиценз").isArray()) {
            for (JsonNode lic : data.get("Лиценз")) {
                licenses.add(new ChekkaResponse.LicenseInfo(
                        textOrNull(lic, "Номер"),
                        textOrNull(lic, "Вид"),
                        textOrNull(lic, "ОрганВыдачи"),
                        textOrNull(lic, "ДатаНач"),
                        textOrNull(lic, "ДатаОкон")));
            }
        }

        // Risk flags
        boolean unfairSupplier = boolOrFalse(data, "НедобПост");
        boolean disqualifiedPersons = boolOrFalse(data, "ДисквЛица");
        boolean massDirector = boolOrFalse(data, "МассРуковод");
        boolean massFounder = boolOrFalse(data, "МассУчред");
        boolean illegalFinancing = boolOrFalse(data, "НелегалФин");
        boolean hasSanctions = boolOrFalse(data, "Санкции");
        boolean sanctionsFounders = boolOrFalse(data, "СанкцУчр");

        // Bankruptcy (ЕФРСБ)
        boolean hasBankruptcy = false;
        if (data.has("ЕФРСБ") && data.get("ЕФРСБ").isArray()) {
            hasBankruptcy = !data.get("ЕФРСБ").isEmpty();
        }

        // SME category
        String smeCategory = null;
        if (data.has("РМСП") && data.get("РМСП").isObject()) {
            smeCategory = textOrNull(data.get("РМСП"), "Кат");
        }

        // Compute risk level from flags
        int riskScore = computeRiskScore(unfairSupplier, disqualifiedPersons, massDirector, massFounder,
                illegalFinancing, hasSanctions, hasBankruptcy, !isActive);
        String riskLevel = riskScore >= 70 ? "HIGH" : riskScore >= 30 ? "MEDIUM" : "LOW";

        // Related companies from directors' links
        List<String> relatedCompanies = new ArrayList<>();
        for (ChekkaResponse.Director dir : directors) {
            // Each director may have related companies — extracted from СвязРуковод
        }
        if (data.has("Руковод") && data.get("Руковод").isArray()) {
            for (JsonNode d : data.get("Руковод")) {
                if (d.has("СвязРуковод") && d.get("СвязРуковод").isArray()) {
                    for (JsonNode ogrn2 : d.get("СвязРуковод")) {
                        relatedCompanies.add("ОГРН " + ogrn2.asText());
                    }
                }
            }
        }

        // Financial data
        ChekkaResponse.FinancialSummary financials = null;
        if (finRoot != null && finRoot.has("data")) {
            JsonNode finData = finRoot.get("data");
            // Find the latest year
            int latestYear = 0;
            for (Iterator<String> it = finData.fieldNames(); it.hasNext(); ) {
                try {
                    int year = Integer.parseInt(it.next());
                    if (year > latestYear) latestYear = year;
                } catch (NumberFormatException ignored) {}
            }
            if (latestYear > 0 && finData.has(String.valueOf(latestYear))) {
                JsonNode yearData = finData.get(String.valueOf(latestYear));
                financials = new ChekkaResponse.FinancialSummary(
                        latestYear,
                        longOrNull(yearData, "2110"),  // Revenue
                        longOrNull(yearData, "2120"),  // Cost of sales
                        longOrNull(yearData, "2100"),  // Gross profit
                        longOrNull(yearData, "2400"),  // Net profit
                        longOrNull(yearData, "1600"),  // Total assets
                        longOrNull(yearData, "1700"),  // Total liabilities
                        longOrNull(yearData, "1300"),  // Equity
                        longOrNull(yearData, "1200"),  // Current assets
                        longOrNull(yearData, "1150")   // Fixed assets
                );
            }
        }

        return new ChekkaResponse(
                inn, riskLevel, riskScore, isActive, hasBankruptcy, false, // hasDebts from FSSP — not in basic checko
                null, null, null, // arbitration counts — not in checko company endpoint
                relatedCompanies, legalAddress, LocalDateTime.now(), null,
                ogrn, kpp, okpo, fullName, shortName, statusName, registrationDate,
                region, mainOkved,
                directors, founders, capitalType, capitalAmount,
                employeeCount, employeeCountYear, checkoPhone, checkoEmail,
                taxAuthorityName, taxAuthorityCode, licenses, additionalOkveds,
                unfairSupplier, disqualifiedPersons, massDirector, massFounder,
                illegalFinancing, hasSanctions, sanctionsFounders,
                smeCategory, financials
        );
    }

    private int computeRiskScore(boolean unfairSupplier, boolean disqualified, boolean massDir,
                                  boolean massFounder, boolean illegalFin, boolean sanctions,
                                  boolean bankruptcy, boolean inactive) {
        int score = 0;
        if (inactive) score += 30;
        if (bankruptcy) score += 25;
        if (sanctions) score += 20;
        if (unfairSupplier) score += 15;
        if (disqualified) score += 15;
        if (illegalFin) score += 15;
        if (massDir) score += 10;
        if (massFounder) score += 10;
        return Math.min(score, 100);
    }

    // ─── JSON helpers ─────────────────────────────────────────────────────────

    private String textOrNull(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) return null;
        return node.get(field).asText();
    }

    private Integer intOrNull(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) return null;
        return node.get(field).asInt();
    }

    private Long longOrNull(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) return null;
        long val = node.get(field).asLong();
        return val == 0 && !node.get(field).asText().equals("0") ? null : val;
    }

    private boolean boolOrFalse(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) return false;
        return node.get(field).asBoolean();
    }

    // ─── Cache helper ─────────────────────────────────────────────────────────

    private record CacheEntry(ChekkaResponse response, long fetchedAt) {}
}
