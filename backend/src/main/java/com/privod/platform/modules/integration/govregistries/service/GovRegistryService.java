package com.privod.platform.modules.integration.govregistries.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.integration.govregistries.domain.CheckStatus;
import com.privod.platform.modules.integration.govregistries.domain.RegistryCheckResult;
import com.privod.platform.modules.integration.govregistries.domain.RegistryConfig;
import com.privod.platform.modules.integration.govregistries.domain.RegistryType;
import com.privod.platform.modules.integration.govregistries.domain.RiskLevel;
import com.privod.platform.modules.integration.govregistries.repository.RegistryCheckResultRepository;
import com.privod.platform.modules.integration.govregistries.repository.RegistryConfigRepository;
import com.privod.platform.modules.integration.govregistries.web.dto.CheckResultResponse;
import com.privod.platform.modules.integration.govregistries.web.dto.CounterpartyCheckSummary;
import com.privod.platform.modules.integration.govregistries.web.dto.RegistryConfigResponse;
import com.privod.platform.modules.integration.govregistries.web.dto.UpdateRegistryConfigRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class GovRegistryService {

    private final RegistryConfigRepository configRepository;
    private final RegistryCheckResultRepository checkResultRepository;
    private final AuditService auditService;

    // === Config Management ===

    @Transactional(readOnly = true)
    public List<RegistryConfigResponse> listConfigs() {
        return configRepository.findByDeletedFalse().stream()
                .map(RegistryConfigResponse::fromEntity)
                .toList();
    }

    @Transactional
    public RegistryConfigResponse updateConfig(RegistryType type, UpdateRegistryConfigRequest request) {
        RegistryConfig config = configRepository.findByRegistryTypeAndDeletedFalse(type)
                .orElseGet(() -> {
                    RegistryConfig newConfig = RegistryConfig.builder()
                            .registryType(type)
                            .enabled(false)
                            .build();
                    return configRepository.save(newConfig);
                });

        if (request.apiUrl() != null) {
            config.setApiUrl(request.apiUrl());
        }
        if (request.apiKey() != null) {
            config.setApiKey(request.apiKey());
        }
        if (request.enabled() != null) {
            config.setEnabled(request.enabled());
        }

        config = configRepository.save(config);
        auditService.logUpdate("RegistryConfig", config.getId(), "config", null, null);

        log.info("Конфигурация реестра {} обновлена ({})", type.getDisplayName(), config.getId());
        return RegistryConfigResponse.fromEntity(config);
    }

    // === Counterparty Checks ===

    @Transactional
    public CounterpartyCheckSummary checkCounterparty(String inn) {
        validateInn(inn);

        List<RegistryConfig> enabledConfigs = configRepository.findByEnabledAndDeletedFalse(true);
        List<RegistryCheckResult> results = new ArrayList<>();

        for (RegistryConfig config : enabledConfigs) {
            try {
                RegistryCheckResult result = performCheck(inn, config.getRegistryType());
                results.add(result);
            } catch (Exception e) {
                log.error("Ошибка проверки {} для ИНН {}: {}", config.getRegistryType(), inn, e.getMessage());
                RegistryCheckResult errorResult = createErrorResult(inn, config.getRegistryType(), e.getMessage());
                results.add(checkResultRepository.save(errorResult));
            }
        }

        // If no configs are enabled, run all checks in stub mode
        if (enabledConfigs.isEmpty()) {
            for (RegistryType type : RegistryType.values()) {
                try {
                    RegistryCheckResult result = performCheck(inn, type);
                    results.add(result);
                } catch (Exception e) {
                    log.error("Ошибка проверки {} для ИНН {}: {}", type, inn, e.getMessage());
                    RegistryCheckResult errorResult = createErrorResult(inn, type, e.getMessage());
                    results.add(checkResultRepository.save(errorResult));
                }
            }
        }

        return buildSummary(null, inn, results);
    }

    @Transactional
    public CheckResultResponse checkEgrul(String inn) {
        validateInn(inn);
        RegistryCheckResult result = performCheck(inn, RegistryType.EGRUL);
        return CheckResultResponse.fromEntity(result);
    }

    @Transactional
    public CheckResultResponse checkFns(String inn) {
        validateInn(inn);
        RegistryCheckResult result = performCheck(inn, RegistryType.FNS);
        return CheckResultResponse.fromEntity(result);
    }

    @Transactional
    public CheckResultResponse checkRnpo(String inn) {
        validateInn(inn);
        RegistryCheckResult result = performCheck(inn, RegistryType.RNPO);
        return CheckResultResponse.fromEntity(result);
    }

    @Transactional
    public CheckResultResponse checkBankruptcy(String inn) {
        validateInn(inn);
        RegistryCheckResult result = performCheck(inn, RegistryType.EFRSB);
        return CheckResultResponse.fromEntity(result);
    }

    @Transactional
    public CheckResultResponse checkSmp(String inn) {
        validateInn(inn);
        RegistryCheckResult result = performCheck(inn, RegistryType.RSMP);
        return CheckResultResponse.fromEntity(result);
    }

    // === History ===

    @Transactional(readOnly = true)
    public Page<CheckResultResponse> getCheckHistory(UUID counterpartyId, Pageable pageable) {
        return checkResultRepository.findByCounterpartyIdAndDeletedFalse(counterpartyId, pageable)
                .map(CheckResultResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public CheckResultResponse getCheckResult(UUID id) {
        RegistryCheckResult result = checkResultRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Результат проверки не найден: " + id));
        return CheckResultResponse.fromEntity(result);
    }

    // === Recheck ===

    @Transactional
    public CounterpartyCheckSummary recheckCounterparty(UUID counterpartyId) {
        List<RegistryCheckResult> previousResults = checkResultRepository
                .findByCounterpartyIdAndDeletedFalse(counterpartyId, Pageable.unpaged())
                .getContent();

        if (previousResults.isEmpty()) {
            throw new EntityNotFoundException(
                    "Предыдущие результаты проверки не найдены для контрагента: " + counterpartyId);
        }

        String inn = previousResults.get(0).getInn();
        CounterpartyCheckSummary summary = checkCounterparty(inn);

        // Update counterpartyId on new results
        List<CheckResultResponse> updatedResults = new ArrayList<>();
        for (CheckResultResponse result : summary.results()) {
            RegistryCheckResult entity = checkResultRepository.findById(result.id())
                    .orElse(null);
            if (entity != null) {
                entity.setCounterpartyId(counterpartyId);
                checkResultRepository.save(entity);
                updatedResults.add(CheckResultResponse.fromEntity(entity));
            }
        }

        return new CounterpartyCheckSummary(
                counterpartyId,
                summary.inn(),
                summary.companyName(),
                summary.overallRiskLevel(),
                summary.overallRiskLevelDisplayName(),
                summary.totalChecks(),
                summary.validChecks(),
                summary.invalidChecks(),
                summary.errorChecks(),
                summary.lastCheckDate(),
                summary.warnings(),
                updatedResults
        );
    }

    // === Scheduled Periodic Checks ===

    @Scheduled(cron = "0 0 3 * * MON") // Every Monday at 3:00 AM
    @Transactional
    public void schedulePeriodicChecks() {
        log.info("Запуск периодической проверки контрагентов по государственным реестрам");

        Instant oneWeekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<UUID> counterpartyIds = checkResultRepository.findCounterpartiesNeedingRecheck(oneWeekAgo);

        int recheckCount = 0;
        for (UUID counterpartyId : counterpartyIds) {
            try {
                recheckCounterparty(counterpartyId);
                recheckCount++;
            } catch (Exception e) {
                log.error("Ошибка повторной проверки контрагента {}: {}", counterpartyId, e.getMessage());
            }
        }

        log.info("Периодическая проверка завершена: {} контрагентов проверено из {} запланированных",
                recheckCount, counterpartyIds.size());
    }

    // === Private helpers ===

    private RegistryCheckResult performCheck(String inn, RegistryType type) {
        log.info("Выполнение проверки {} для ИНН {}", type.getDisplayName(), inn);

        // Stub implementations - return mock data based on registry type
        RegistryCheckResult result = switch (type) {
            case EGRUL -> stubCheckEgrul(inn);
            case FNS -> stubCheckFns(inn);
            case RNPO -> stubCheckRnpo(inn);
            case EFRSB -> stubCheckEfrsb(inn);
            case RSMP -> stubCheckRsmp(inn);
        };

        result = checkResultRepository.save(result);
        auditService.logCreate("RegistryCheckResult", result.getId());

        log.info("Проверка {} для ИНН {} завершена: статус={}, риск={}",
                type.getDisplayName(), inn, result.getStatus(), result.getRiskLevel());
        return result;
    }

    private RegistryCheckResult stubCheckEgrul(String inn) {
        // Stub: validates INN format, returns mock EGRUL data
        boolean validFormat = isValidInnFormat(inn);

        return RegistryCheckResult.builder()
                .inn(inn)
                .registryType(RegistryType.EGRUL)
                .checkDate(Instant.now())
                .status(validFormat ? CheckStatus.VALID : CheckStatus.NOT_FOUND)
                .companyName(validFormat ? "ООО \"Тестовая организация\"" : null)
                .ogrn(validFormat ? "1" + inn.substring(0, Math.min(12, inn.length())) + "0" : null)
                .registrationDate(validFormat ? LocalDate.of(2015, 3, 15) : null)
                .isActive(validFormat)
                .chiefName(validFormat ? "Иванов Иван Иванович" : null)
                .authorizedCapital(validFormat ? new BigDecimal("10000.00") : null)
                .riskLevel(validFormat ? RiskLevel.LOW : RiskLevel.HIGH)
                .rawResponse("{\"source\":\"stub\",\"registry\":\"EGRUL\",\"inn\":\"" + inn + "\"}")
                .warnings(validFormat ? null : "ИНН не найден в ЕГРЮЛ")
                .build();
    }

    private RegistryCheckResult stubCheckFns(String inn) {
        // Stub: FNS tax debt check
        boolean validFormat = isValidInnFormat(inn);

        return RegistryCheckResult.builder()
                .inn(inn)
                .registryType(RegistryType.FNS)
                .checkDate(Instant.now())
                .status(validFormat ? CheckStatus.VALID : CheckStatus.NOT_FOUND)
                .companyName(validFormat ? "ООО \"Тестовая организация\"" : null)
                .isActive(validFormat)
                .riskLevel(validFormat ? RiskLevel.LOW : RiskLevel.MEDIUM)
                .rawResponse("{\"source\":\"stub\",\"registry\":\"FNS\",\"inn\":\"" + inn + "\",\"taxDebt\":0}")
                .warnings(validFormat ? null : "Не удалось проверить налоговую задолженность")
                .build();
    }

    private RegistryCheckResult stubCheckRnpo(String inn) {
        // Stub: unfair suppliers registry check
        boolean validFormat = isValidInnFormat(inn);

        return RegistryCheckResult.builder()
                .inn(inn)
                .registryType(RegistryType.RNPO)
                .checkDate(Instant.now())
                .status(validFormat ? CheckStatus.VALID : CheckStatus.NOT_FOUND)
                .companyName(validFormat ? "ООО \"Тестовая организация\"" : null)
                .isActive(validFormat)
                .riskLevel(RiskLevel.LOW) // Not found in unfair suppliers = good
                .rawResponse("{\"source\":\"stub\",\"registry\":\"RNPO\",\"inn\":\"" + inn + "\",\"found\":false}")
                .warnings(null)
                .build();
    }

    private RegistryCheckResult stubCheckEfrsb(String inn) {
        // Stub: bankruptcy registry check
        boolean validFormat = isValidInnFormat(inn);

        return RegistryCheckResult.builder()
                .inn(inn)
                .registryType(RegistryType.EFRSB)
                .checkDate(Instant.now())
                .status(validFormat ? CheckStatus.VALID : CheckStatus.NOT_FOUND)
                .companyName(validFormat ? "ООО \"Тестовая организация\"" : null)
                .isActive(validFormat)
                .riskLevel(RiskLevel.LOW) // No bankruptcy records = good
                .rawResponse("{\"source\":\"stub\",\"registry\":\"EFRSB\",\"inn\":\"" + inn + "\",\"bankruptcyRecords\":0}")
                .warnings(null)
                .build();
    }

    private RegistryCheckResult stubCheckRsmp(String inn) {
        // Stub: SME registry check
        boolean validFormat = isValidInnFormat(inn);

        return RegistryCheckResult.builder()
                .inn(inn)
                .registryType(RegistryType.RSMP)
                .checkDate(Instant.now())
                .status(validFormat ? CheckStatus.VALID : CheckStatus.NOT_FOUND)
                .companyName(validFormat ? "ООО \"Тестовая организация\"" : null)
                .isActive(validFormat)
                .riskLevel(RiskLevel.LOW)
                .rawResponse("{\"source\":\"stub\",\"registry\":\"RSMP\",\"inn\":\"" + inn + "\",\"category\":\"micro\"}")
                .warnings(null)
                .build();
    }

    private RegistryCheckResult createErrorResult(String inn, RegistryType type, String errorMessage) {
        return RegistryCheckResult.builder()
                .inn(inn)
                .registryType(type)
                .checkDate(Instant.now())
                .status(CheckStatus.ERROR)
                .isActive(false)
                .riskLevel(RiskLevel.MEDIUM)
                .rawResponse("{\"error\":\"" + errorMessage + "\"}")
                .warnings("Ошибка при проверке: " + errorMessage)
                .build();
    }

    private CounterpartyCheckSummary buildSummary(UUID counterpartyId, String inn,
                                                    List<RegistryCheckResult> results) {
        List<CheckResultResponse> responseList = results.stream()
                .map(CheckResultResponse::fromEntity)
                .toList();

        String companyName = results.stream()
                .filter(r -> r.getCompanyName() != null)
                .map(RegistryCheckResult::getCompanyName)
                .findFirst()
                .orElse(null);

        int validCount = (int) results.stream()
                .filter(r -> r.getStatus() == CheckStatus.VALID)
                .count();
        int invalidCount = (int) results.stream()
                .filter(r -> r.getStatus() == CheckStatus.INVALID || r.getStatus() == CheckStatus.NOT_FOUND)
                .count();
        int errorCount = (int) results.stream()
                .filter(r -> r.getStatus() == CheckStatus.ERROR)
                .count();

        List<String> allWarnings = results.stream()
                .filter(r -> r.getWarnings() != null && !r.getWarnings().isBlank())
                .map(RegistryCheckResult::getWarnings)
                .toList();

        // Calculate overall risk level
        RiskLevel overallRisk = calculateOverallRisk(results);

        Instant lastCheckDate = results.stream()
                .map(RegistryCheckResult::getCheckDate)
                .max(Instant::compareTo)
                .orElse(Instant.now());

        return new CounterpartyCheckSummary(
                counterpartyId,
                inn,
                companyName,
                overallRisk,
                overallRisk.getDisplayName(),
                results.size(),
                validCount,
                invalidCount,
                errorCount,
                lastCheckDate,
                allWarnings,
                responseList
        );
    }

    private RiskLevel calculateOverallRisk(List<RegistryCheckResult> results) {
        boolean hasHigh = results.stream()
                .anyMatch(r -> r.getRiskLevel() == RiskLevel.HIGH);
        boolean hasMedium = results.stream()
                .anyMatch(r -> r.getRiskLevel() == RiskLevel.MEDIUM);
        boolean hasInvalid = results.stream()
                .anyMatch(r -> r.getStatus() == CheckStatus.INVALID);

        if (hasHigh || hasInvalid) {
            return RiskLevel.HIGH;
        }
        if (hasMedium) {
            return RiskLevel.MEDIUM;
        }
        return RiskLevel.LOW;
    }

    private void validateInn(String inn) {
        if (inn == null || inn.isBlank()) {
            throw new IllegalArgumentException("ИНН не может быть пустым");
        }
        String cleaned = inn.trim().replaceAll("\\s+", "");
        if (!cleaned.matches("\\d{10}|\\d{12}")) {
            throw new IllegalArgumentException(
                    "Некорректный формат ИНН: должен содержать 10 (юр. лицо) или 12 (физ. лицо/ИП) цифр");
        }
    }

    private boolean isValidInnFormat(String inn) {
        if (inn == null || inn.isBlank()) {
            return false;
        }
        String cleaned = inn.trim().replaceAll("\\s+", "");
        return cleaned.matches("\\d{10}|\\d{12}");
    }
}
