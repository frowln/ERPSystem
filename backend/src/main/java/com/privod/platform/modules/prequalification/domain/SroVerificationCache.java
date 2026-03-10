package com.privod.platform.modules.prequalification.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Кэш результатов проверки членства подрядчика в СРО (Саморегулируемая организация).
 * <p>
 * В России для выполнения строительных работ по контрактам свыше 3 млн руб.
 * подрядчик обязан быть членом СРО (ФЗ-315, ГрК РФ ст.55.8).
 * <p>
 * Данные кэшируются на 24 часа для снижения нагрузки на внешний реестр.
 */
@Entity
@Table(name = "sro_verification_cache",
        indexes = @Index(name = "idx_sro_cache_inn", columnList = "inn"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SroVerificationCache extends BaseEntity {

    /** ИНН подрядчика (10 цифр — юр.лицо, 12 — ИП) */
    @Column(name = "inn", nullable = false, length = 12)
    private String inn;

    /** Наименование организации из реестра СРО */
    @Column(name = "company_name", length = 500)
    private String companyName;

    /** Является ли действующим членом СРО */
    @Column(name = "is_member", nullable = false)
    @Builder.Default
    private Boolean isMember = false;

    /** Полное наименование СРО */
    @Column(name = "sro_name", length = 500)
    private String sroName;

    /** Реестровый номер СРО (формат: СРО-С-ХХХ-ХХХХХХХХ) */
    @Column(name = "sro_number", length = 100)
    private String sroNumber;

    /** Номер свидетельства о допуске / выписки из реестра */
    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;

    /** Дата вступления в СРО */
    @Column(name = "member_since")
    private LocalDate memberSince;

    /** Статус членства: ACTIVE, SUSPENDED, EXCLUDED, NOT_FOUND */
    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "UNKNOWN";

    /** Виды работ, на которые имеется допуск (JSON-массив) */
    @Column(name = "allowed_work_types", columnDefinition = "TEXT")
    private String allowedWorkTypes;

    /** Размер взноса в компенсационный фонд (руб.) */
    @Column(name = "compensation_fund", precision = 15, scale = 2)
    private BigDecimal compensationFund;

    /**
     * Уровень ответственности по размеру обязательств:
     * <ul>
     *   <li>1 — до 60 млн руб.</li>
     *   <li>2 — до 500 млн руб.</li>
     *   <li>3 — до 3 млрд руб.</li>
     *   <li>4 — до 10 млрд руб.</li>
     *   <li>5 — свыше 10 млрд руб.</li>
     * </ul>
     */
    @Column(name = "competency_level", length = 10)
    private String competencyLevel;

    /** Момент проверки через внешний реестр */
    @Column(name = "verified_at")
    private LocalDateTime verifiedAt;

    /** Момент помещения записи в локальный кэш */
    @Column(name = "cached_at")
    @Builder.Default
    private LocalDateTime cachedAt = LocalDateTime.now();
}
