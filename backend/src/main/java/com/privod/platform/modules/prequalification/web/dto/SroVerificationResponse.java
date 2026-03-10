package com.privod.platform.modules.prequalification.web.dto;

import com.privod.platform.modules.prequalification.domain.SroVerificationCache;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Результат проверки членства подрядчика в СРО.
 * <p>
 * Возвращается клиенту из endpoint GET /api/sro/verify/{inn}.
 */
public record SroVerificationResponse(
        UUID id,
        String inn,
        String companyName,
        boolean isMember,
        /** Полное наименование СРО, напр. «Ассоциация «НОПРИЗ»» */
        String sroName,
        /** Реестровый номер СРО, напр. «СРО-С-001-01012010» */
        String sroNumber,
        /** Номер свидетельства о допуске */
        String certificateNumber,
        /** Дата вступления в СРО */
        LocalDate memberSince,
        /** Дата окончания действия (null — бессрочно) */
        LocalDate expiresAt,
        /** Статус: ACTIVE, SUSPENDED, EXCLUDED, NOT_FOUND */
        String status,
        /** Виды работ из приказа Минстроя */
        List<String> allowedWorkTypes,
        /** Размер взноса в компенсационный фонд (руб.) */
        BigDecimal compensationFund,
        /** Уровень ответственности (1–5) */
        String competencyLevel,
        /** Когда была выполнена проверка */
        LocalDateTime verifiedAt,
        /** Источник данных: «reestr-sro.ru» или «cache» */
        String source
) {
    /**
     * Маппинг из кэш-сущности в DTO ответа.
     */
    public static SroVerificationResponse fromCache(SroVerificationCache cache, String source) {
        List<String> workTypes = parseWorkTypes(cache.getAllowedWorkTypes());

        return new SroVerificationResponse(
                cache.getId(),
                cache.getInn(),
                cache.getCompanyName(),
                Boolean.TRUE.equals(cache.getIsMember()),
                cache.getSroName(),
                cache.getSroNumber(),
                cache.getCertificateNumber(),
                cache.getMemberSince(),
                null, // expiresAt — членство в СРО бессрочное по ФЗ-315
                cache.getStatus(),
                workTypes,
                cache.getCompensationFund(),
                cache.getCompetencyLevel(),
                cache.getVerifiedAt(),
                source
        );
    }

    /**
     * Парсинг JSON-строки с видами работ в список.
     */
    private static List<String> parseWorkTypes(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        // Простой парсинг JSON-массива строк без Jackson
        String trimmed = json.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
            trimmed = trimmed.substring(1, trimmed.length() - 1);
        }
        if (trimmed.isBlank()) {
            return List.of();
        }
        return java.util.Arrays.stream(trimmed.split(","))
                .map(String::trim)
                .map(s -> s.startsWith("\"") && s.endsWith("\"") ? s.substring(1, s.length() - 1) : s)
                .filter(s -> !s.isBlank())
                .toList();
    }
}
