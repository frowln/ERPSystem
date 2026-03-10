package com.privod.platform.modules.prequalification.service;

import com.privod.platform.modules.prequalification.domain.SroVerificationCache;
import com.privod.platform.modules.prequalification.repository.SroVerificationCacheRepository;
import com.privod.platform.modules.prequalification.web.dto.SroVerificationResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Сервис проверки членства подрядчиков в СРО (Саморегулируемая организация).
 * <p>
 * Согласно ФЗ-315 и Градостроительному кодексу (ст. 55.8), выполнение строительных
 * работ по контрактам свыше 3 млн руб. допускается только членами СРО.
 * <p>
 * На данном этапе используется симуляция реестра СРО (reestr-sro.ru).
 * В продакшене — интеграция через API НОПРИЗ / НОСТРОЙ.
 * <p>
 * Логика кэширования: результаты проверки кэшируются на 24 часа.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SroVerificationService {

    private static final int CACHE_HOURS = 24;

    private final SroVerificationCacheRepository cacheRepository;

    /**
     * Словарь известных организаций для симуляции реестра СРО.
     * В продакшене заменяется на вызов API reestr-sro.ru / НОСТРОЙ / НОПРИЗ.
     */
    private static final Map<String, SroSimulatedRecord> SIMULATED_REGISTRY = Map.ofEntries(
            // Крупные подрядчики и генподрядчики
            Map.entry("7708004767", new SroSimulatedRecord(
                    "ПАО «ЛУКОЙЛ»", true, "Ассоциация «НОПРИЗ»",
                    "СРО-И-002-28012010", "ИП-0123-2015",
                    LocalDate.of(2015, 3, 12), "ACTIVE",
                    "[\"Инженерные изыскания\",\"Проектирование зданий и сооружений\"]",
                    new BigDecimal("5000000"), "3"
            )),
            Map.entry("7710030411", new SroSimulatedRecord(
                    "ООО «СтройГазМонтаж»", true, "Ассоциация «НОСТРОЙ»",
                    "СРО-С-045-15032010", "С-045-7710030411-2012",
                    LocalDate.of(2012, 6, 1), "ACTIVE",
                    "[\"Строительство, реконструкция и капитальный ремонт\",\"Монтаж технологического оборудования\",\"Пусконаладочные работы\"]",
                    new BigDecimal("25000000"), "5"
            )),
            Map.entry("7702070139", new SroSimulatedRecord(
                    "ПАО «Группа Компаний ПИК»", true, "Ассоциация «НОСТРОЙ»",
                    "СРО-С-012-01062010", "С-012-7702070139-2011",
                    LocalDate.of(2011, 1, 15), "ACTIVE",
                    "[\"Строительство, реконструкция и капитальный ремонт\",\"Работы по устройству наружных сетей и сооружений\",\"Работы по устройству внутренних инженерных систем\"]",
                    new BigDecimal("30000000"), "5"
            )),
            Map.entry("7728168971", new SroSimulatedRecord(
                    "ООО «Главстрой»", true, "Ассоциация «ГЛАВСТРОЙ»",
                    "СРО-С-001-01012010", "С-001-7728168971-2010",
                    LocalDate.of(2010, 1, 1), "ACTIVE",
                    "[\"Строительство, реконструкция и капитальный ремонт\",\"Земляные работы\",\"Свайные работы\",\"Бетонные и железобетонные работы\",\"Монтаж металлических конструкций\"]",
                    new BigDecimal("15000000"), "4"
            )),
            Map.entry("5024029600", new SroSimulatedRecord(
                    "ООО «Стройтранснефтегаз»", true, "Ассоциация «Объединение строителей в ТЭК»",
                    "СРО-С-089-20072011", "С-089-5024029600-2011",
                    LocalDate.of(2011, 7, 20), "ACTIVE",
                    "[\"Строительство линейных объектов\",\"Монтаж технологических трубопроводов\",\"Работы по устройству наружных сетей\"]",
                    new BigDecimal("20000000"), "4"
            )),
            // Приостановленное членство — для демонстрации статуса SUSPENDED
            Map.entry("7715038530", new SroSimulatedRecord(
                    "ООО «Промстрой»", true, "Ассоциация «НОСТРОЙ»",
                    "СРО-С-155-03092012", "С-155-7715038530-2012",
                    LocalDate.of(2012, 9, 3), "SUSPENDED",
                    "[\"Строительство, реконструкция и капитальный ремонт\"]",
                    new BigDecimal("300000"), "1"
            )),
            // Исключённый из СРО — для демонстрации статуса EXCLUDED
            Map.entry("7719864397", new SroSimulatedRecord(
                    "ООО «ТехМонтажСтрой»", false, "Ассоциация «Строители Подмосковья»",
                    "СРО-С-201-12042013", "С-201-7719864397-2013",
                    LocalDate.of(2013, 4, 12), "EXCLUDED",
                    "[]",
                    BigDecimal.ZERO, "1"
            )),
            // Проектные организации (НОПРИЗ)
            Map.entry("7701340436", new SroSimulatedRecord(
                    "АО «Моспроект»", true, "Ассоциация «НОПРИЗ»",
                    "СРО-П-003-15022010", "П-003-7701340436-2010",
                    LocalDate.of(2010, 2, 15), "ACTIVE",
                    "[\"Архитектурно-строительное проектирование\",\"Технологическое проектирование\"]",
                    new BigDecimal("7500000"), "3"
            )),
            Map.entry("7707083893", new SroSimulatedRecord(
                    "ПАО «Газпром»", true, "Ассоциация «НОСТРОЙ»",
                    "СРО-С-007-01032010", "С-007-7707083893-2010",
                    LocalDate.of(2010, 3, 1), "ACTIVE",
                    "[\"Строительство, реконструкция и капитальный ремонт\",\"Монтаж технологического оборудования\",\"Пусконаладочные работы\",\"Строительство линейных объектов\"]",
                    new BigDecimal("50000000"), "5"
            ))
    );

    /**
     * Проверить членство подрядчика в СРО по ИНН.
     * <p>
     * Алгоритм:
     * <ol>
     *   <li>Валидация формата ИНН (10 или 12 цифр)</li>
     *   <li>Поиск в локальном кэше (актуальность — 24 часа)</li>
     *   <li>Если кэш протух или отсутствует — запрос к внешнему реестру (симуляция)</li>
     *   <li>Сохранение результата в кэш</li>
     * </ol>
     *
     * @param inn ИНН подрядчика (10 или 12 цифр)
     * @return результат проверки с полной информацией о членстве
     * @throws IllegalArgumentException если ИНН имеет некорректный формат
     */
    @Transactional
    public SroVerificationResponse verify(String inn) {
        // 1. Валидация формата ИНН
        validateInn(inn);

        // 2. Поиск в кэше (актуальные записи не старше CACHE_HOURS часов)
        LocalDateTime freshThreshold = LocalDateTime.now().minusHours(CACHE_HOURS);
        Optional<SroVerificationCache> cached = cacheRepository.findFreshByInn(inn, freshThreshold);

        if (cached.isPresent()) {
            log.debug("СРО-проверка по ИНН {} — найдено в кэше (кэшировано {})", inn, cached.get().getCachedAt());
            return SroVerificationResponse.fromCache(cached.get(), "cache");
        }

        // 3. Запрос к внешнему реестру (симуляция)
        log.info("СРО-проверка по ИНН {} — запрос к реестру (симуляция)", inn);
        SroVerificationCache result = queryExternalRegistry(inn);

        // 4. Сохранение в кэш
        result = cacheRepository.save(result);
        log.info("СРО-проверка по ИНН {}: статус={}, СРО={}, уровень={}",
                inn, result.getStatus(), result.getSroName(), result.getCompetencyLevel());

        return SroVerificationResponse.fromCache(result, "reestr-sro.ru");
    }

    /**
     * Получить историю всех проверок СРО (для аудита и аналитики).
     */
    @Transactional(readOnly = true)
    public List<SroVerificationResponse> getHistory() {
        return cacheRepository.findAllByOrderByCachedAtDesc().stream()
                .map(cache -> SroVerificationResponse.fromCache(cache, "cache"))
                .toList();
    }

    /**
     * Получить историю проверок конкретного ИНН.
     */
    @Transactional(readOnly = true)
    public List<SroVerificationResponse> getHistoryByInn(String inn) {
        validateInn(inn);
        return cacheRepository.findByInnOrderByCachedAtDesc(inn).stream()
                .map(cache -> SroVerificationResponse.fromCache(cache, "cache"))
                .toList();
    }

    /**
     * Принудительно обновить данные СРО (игнорируя кэш).
     */
    @Transactional
    public SroVerificationResponse forceRefresh(String inn) {
        validateInn(inn);
        log.info("СРО-проверка по ИНН {} — принудительное обновление", inn);

        SroVerificationCache result = queryExternalRegistry(inn);
        result = cacheRepository.save(result);

        return SroVerificationResponse.fromCache(result, "reestr-sro.ru");
    }

    // ───────────────────────── Внутренние методы ─────────────────────────

    /**
     * Валидация формата ИНН.
     * <p>
     * ИНН юридического лица — 10 цифр, ИНН ИП — 12 цифр.
     * Проверяется контрольная сумма (упрощённо — только длина и цифры).
     */
    private void validateInn(String inn) {
        if (inn == null || inn.isBlank()) {
            throw new IllegalArgumentException("ИНН не может быть пустым");
        }

        String cleaned = inn.trim();
        if (!cleaned.matches("^\\d{10}(\\d{2})?$")) {
            throw new IllegalArgumentException(
                    "Некорректный формат ИНН: ожидается 10 цифр (юр. лицо) или 12 цифр (ИП), получено: " + cleaned);
        }
    }

    /**
     * Симуляция запроса к внешнему реестру СРО (reestr-sro.ru).
     * <p>
     * В продакшене здесь будет HTTP-вызов к API НОСТРОЙ / НОПРИЗ:
     * <ul>
     *   <li>GET https://reestr.nostroy.ru/api/sro/member?inn={inn}</li>
     *   <li>GET https://reestr.noprize.ru/api/sro/member?inn={inn}</li>
     * </ul>
     */
    private SroVerificationCache queryExternalRegistry(String inn) {
        SroSimulatedRecord simulated = SIMULATED_REGISTRY.get(inn);
        LocalDateTime now = LocalDateTime.now();

        if (simulated != null) {
            // Найдено в симулированном реестре
            return SroVerificationCache.builder()
                    .inn(inn)
                    .companyName(simulated.companyName())
                    .isMember(simulated.isMember())
                    .sroName(simulated.sroName())
                    .sroNumber(simulated.sroNumber())
                    .certificateNumber(simulated.certificateNumber())
                    .memberSince(simulated.memberSince())
                    .status(simulated.status())
                    .allowedWorkTypes(simulated.allowedWorkTypes())
                    .compensationFund(simulated.compensationFund())
                    .competencyLevel(simulated.competencyLevel())
                    .verifiedAt(now)
                    .cachedAt(now)
                    .build();
        }

        // ИНН не найден в реестре — организация не является членом СРО
        log.warn("СРО-проверка: ИНН {} не найден в реестре", inn);
        return SroVerificationCache.builder()
                .inn(inn)
                .companyName(null)
                .isMember(false)
                .sroName(null)
                .sroNumber(null)
                .certificateNumber(null)
                .memberSince(null)
                .status("NOT_FOUND")
                .allowedWorkTypes(null)
                .compensationFund(null)
                .competencyLevel(null)
                .verifiedAt(now)
                .cachedAt(now)
                .build();
    }

    /**
     * Внутренний record для хранения симулированных данных реестра СРО.
     */
    private record SroSimulatedRecord(
            String companyName,
            boolean isMember,
            String sroName,
            String sroNumber,
            String certificateNumber,
            LocalDate memberSince,
            String status,
            String allowedWorkTypes,
            BigDecimal compensationFund,
            String competencyLevel
    ) {}
}
