package com.privod.platform.modules.payroll.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.calendar.service.WorkCalendarService;
import com.privod.platform.modules.finance.domain.BudgetCategory;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.repository.BudgetItemRepository;
import com.privod.platform.modules.hr.domain.TimesheetStatus;
import com.privod.platform.modules.hr.repository.TimesheetRepository;
import com.privod.platform.modules.payroll.domain.PayrollCalculation;
import com.privod.platform.modules.payroll.domain.PayrollCalculationStatus;
import com.privod.platform.modules.payroll.domain.PayrollTemplate;
import com.privod.platform.modules.payroll.domain.PayrollType;
import com.privod.platform.modules.payroll.repository.PayrollCalculationRepository;
import com.privod.platform.modules.payroll.repository.PayrollTemplateRepository;
import com.privod.platform.modules.payroll.web.dto.BulkPayrollCalculateRequest;
import com.privod.platform.modules.payroll.web.dto.CreatePayrollTemplateRequest;
import com.privod.platform.modules.payroll.web.dto.PayrollCalculateRequest;
import com.privod.platform.modules.payroll.web.dto.PayrollCalculationResponse;
import com.privod.platform.modules.payroll.web.dto.PayrollTemplateResponse;
import com.privod.platform.modules.payroll.web.dto.UpdatePayrollTemplateRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollService {

    private final PayrollTemplateRepository templateRepository;
    private final PayrollCalculationRepository calculationRepository;
    private final TimesheetRepository timesheetRepository;       // P0-3: Табель→Зарплата
    private final BudgetItemRepository budgetItemRepository;     // P0-4: Зарплата→Бюджет ФОТ
    private final WorkCalendarService workCalendarService;       // P1-HR-1: Нормативные часы
    private final AuditService auditService;

    // ---- Template CRUD ----

    @Transactional(readOnly = true)
    public Page<PayrollTemplateResponse> listTemplates(PayrollType type, Boolean isActive, Pageable pageable) {
        if (isActive != null) {
            return templateRepository.findByIsActiveAndDeletedFalse(isActive, pageable)
                    .map(PayrollTemplateResponse::fromEntity);
        }
        if (type != null) {
            return templateRepository.findByTypeAndDeletedFalse(type, pageable)
                    .map(PayrollTemplateResponse::fromEntity);
        }
        return templateRepository.findByDeletedFalse(pageable)
                .map(PayrollTemplateResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PayrollTemplateResponse getTemplate(UUID id) {
        PayrollTemplate template = getTemplateOrThrow(id);
        return PayrollTemplateResponse.fromEntity(template);
    }

    @Transactional
    public PayrollTemplateResponse createTemplate(CreatePayrollTemplateRequest request) {
        if (request.code() != null && templateRepository.existsByCodeAndDeletedFalse(request.code())) {
            throw new IllegalArgumentException("Шаблон с кодом '" + request.code() + "' уже существует");
        }

        PayrollTemplate template = PayrollTemplate.builder()
                .name(request.name())
                .code(request.code())
                .description(request.description())
                .type(request.type())
                .baseSalary(request.baseSalary())
                .hourlyRate(request.hourlyRate())
                .overtimeMultiplier(request.overtimeMultiplier() != null
                        ? request.overtimeMultiplier() : new BigDecimal("1.50"))
                .bonusPercentage(request.bonusPercentage() != null
                        ? request.bonusPercentage() : BigDecimal.ZERO)
                .taxRate(request.taxRate() != null
                        ? request.taxRate() : new BigDecimal("13.00"))
                .pensionRate(request.pensionRate() != null
                        ? request.pensionRate() : new BigDecimal("22.00"))
                .socialRate(request.socialRate() != null
                        ? request.socialRate() : new BigDecimal("2.90"))
                .medicalRate(request.medicalRate() != null
                        ? request.medicalRate() : new BigDecimal("5.10"))
                .currency(request.currency() != null ? request.currency() : "RUB")
                .isActive(true)
                .projectId(request.projectId())
                .build();

        template = templateRepository.save(template);
        auditService.logCreate("PayrollTemplate", template.getId());

        log.info("Шаблон расчёта зарплаты создан: {} - {} ({})",
                template.getCode(), template.getName(), template.getId());
        return PayrollTemplateResponse.fromEntity(template);
    }

    @Transactional
    public PayrollTemplateResponse updateTemplate(UUID id, UpdatePayrollTemplateRequest request) {
        PayrollTemplate template = getTemplateOrThrow(id);

        if (request.name() != null) {
            template.setName(request.name());
        }
        if (request.description() != null) {
            template.setDescription(request.description());
        }
        if (request.type() != null) {
            template.setType(request.type());
        }
        if (request.baseSalary() != null) {
            template.setBaseSalary(request.baseSalary());
        }
        if (request.hourlyRate() != null) {
            template.setHourlyRate(request.hourlyRate());
        }
        if (request.overtimeMultiplier() != null) {
            template.setOvertimeMultiplier(request.overtimeMultiplier());
        }
        if (request.bonusPercentage() != null) {
            template.setBonusPercentage(request.bonusPercentage());
        }
        if (request.taxRate() != null) {
            template.setTaxRate(request.taxRate());
        }
        if (request.pensionRate() != null) {
            template.setPensionRate(request.pensionRate());
        }
        if (request.socialRate() != null) {
            template.setSocialRate(request.socialRate());
        }
        if (request.medicalRate() != null) {
            template.setMedicalRate(request.medicalRate());
        }
        if (request.currency() != null) {
            template.setCurrency(request.currency());
        }
        if (request.isActive() != null) {
            template.setActive(request.isActive());
        }
        if (request.projectId() != null) {
            template.setProjectId(request.projectId());
        }

        template = templateRepository.save(template);
        auditService.logUpdate("PayrollTemplate", template.getId(), "multiple", null, null);

        log.info("Шаблон расчёта зарплаты обновлён: {} ({})", template.getCode(), template.getId());
        return PayrollTemplateResponse.fromEntity(template);
    }

    @Transactional
    public void deleteTemplate(UUID id) {
        PayrollTemplate template = getTemplateOrThrow(id);
        template.softDelete();
        templateRepository.save(template);
        auditService.logDelete("PayrollTemplate", template.getId());

        log.info("Шаблон расчёта зарплаты удалён: {} ({})", template.getCode(), template.getId());
    }

    // ---- Calculation ----

    @Transactional(readOnly = true)
    public Page<PayrollCalculationResponse> listCalculations(UUID employeeId,
                                                              PayrollCalculationStatus status,
                                                              Pageable pageable) {
        if (employeeId != null) {
            return calculationRepository.findByEmployeeIdAndDeletedFalse(employeeId, pageable)
                    .map(PayrollCalculationResponse::fromEntity);
        }
        if (status != null) {
            return calculationRepository.findByStatusAndDeletedFalse(status, pageable)
                    .map(PayrollCalculationResponse::fromEntity);
        }
        return calculationRepository.findByDeletedFalse(pageable)
                .map(PayrollCalculationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public PayrollCalculationResponse getCalculation(UUID id) {
        PayrollCalculation calc = getCalculationOrThrow(id);
        return PayrollCalculationResponse.fromEntity(calc);
    }

    @Transactional
    public PayrollCalculationResponse calculatePayroll(PayrollCalculateRequest request) {
        PayrollTemplate template = getTemplateOrThrow(request.templateId());

        if (!template.isActive()) {
            throw new IllegalStateException("Шаблон расчёта неактивен");
        }

        validatePeriod(request.periodStart(), request.periodEnd());

        BigDecimal basePay = calculateBasePay(template, request);
        BigDecimal overtimePay = calculateOvertimePay(template, request);
        BigDecimal bonusPay = calculateBonusPay(template, basePay);
        BigDecimal hourlyRate = template.getHourlyRate() != null ? template.getHourlyRate() : BigDecimal.ZERO;
        BigDecimal nightPay = calculateNightPay(hourlyRate, request);
        BigDecimal holidayPay = calculateHolidayPay(hourlyRate, request);
        BigDecimal grossPay = basePay.add(overtimePay).add(bonusPay).add(nightPay).add(holidayPay);

        // НДФЛ — прогрессивная шкала НК РФ ст.224 (ред. 2024)
        // Ставки: 13% до 2.4М, 15% до 5М, 18% до 20М, 20% до 50М, 22% свыше 50М
        BigDecimal taxDeduction = calculateProgressiveNdfl(grossPay, request);
        // Страховые взносы НК РФ гл.34 — расходы РАБОТОДАТЕЛЯ, не вычитаются из зарплаты
        // P1-HR-3: ОПС — порог ФЗ-178 (2025): 22% до 2 225 000 руб., 10% сверх порога
        BigDecimal cumulativeAnnualIncome = BigDecimal.ZERO;
        if (request.employeeId() != null && request.periodStart() != null) {
            LocalDate yearStart = LocalDate.of(request.periodStart().getYear(), 1, 1);
            cumulativeAnnualIncome = calculationRepository.sumGrossPayForEmployee(
                    request.employeeId(), yearStart, request.periodStart());
        }
        BigDecimal pensionContribution = calculatePensionContribution(grossPay, cumulativeAnnualIncome);
        BigDecimal socialContribution = calculateDeduction(grossPay, template.getSocialRate());
        BigDecimal medicalContribution = calculateDeduction(grossPay, template.getMedicalRate());
        BigDecimal employerContributions = pensionContribution.add(socialContribution).add(medicalContribution);
        // totalDeductions = только НДФЛ (сумма, реально удержанная у сотрудника)
        BigDecimal totalDeductions = taxDeduction;
        BigDecimal netPay = grossPay.subtract(taxDeduction);

        PayrollCalculation calc = PayrollCalculation.builder()
                .templateId(template.getId())
                .employeeId(request.employeeId())
                .periodStart(request.periodStart())
                .periodEnd(request.periodEnd())
                .basePay(basePay)
                .overtimePay(overtimePay)
                .bonusPay(bonusPay)
                .nightPay(nightPay)
                .holidayPay(holidayPay)
                .grossPay(grossPay)
                .taxDeduction(taxDeduction)
                .pensionDeduction(pensionContribution)
                .socialDeduction(socialContribution)
                .medicalDeduction(medicalContribution)
                .totalDeductions(totalDeductions)
                .employerContributions(employerContributions)
                .netPay(netPay)
                .budgetId(request.budgetId())
                .status(PayrollCalculationStatus.CALCULATED)
                .build();

        calc = calculationRepository.save(calc);
        auditService.logCreate("PayrollCalculation", calc.getId());

        log.info("Расчёт зарплаты выполнен: сотрудник={}, период={}-{}, к выплате={} ({})",
                request.employeeId(), request.periodStart(), request.periodEnd(),
                netPay, calc.getId());
        return PayrollCalculationResponse.fromEntity(calc);
    }

    @Transactional
    public List<PayrollCalculationResponse> bulkCalculate(BulkPayrollCalculateRequest request) {
        List<PayrollCalculationResponse> results = new ArrayList<>();
        for (PayrollCalculateRequest calcRequest : request.calculations()) {
            results.add(calculatePayroll(calcRequest));
        }
        log.info("Массовый расчёт зарплаты выполнен: {} расчётов", results.size());
        return results;
    }

    @Transactional
    public PayrollCalculationResponse approveCalculation(UUID id) {
        PayrollCalculation calc = getCalculationOrThrow(id);
        PayrollCalculationStatus oldStatus = calc.getStatus();

        if (!calc.canTransitionTo(PayrollCalculationStatus.APPROVED)) {
            throw new IllegalStateException(
                    String.format("Невозможно утвердить расчёт из статуса %s",
                            oldStatus.getDisplayName()));
        }

        calc.setStatus(PayrollCalculationStatus.APPROVED);
        calc.setApprovedAt(Instant.now());
        calc = calculationRepository.save(calc);
        auditService.logStatusChange("PayrollCalculation", calc.getId(),
                oldStatus.name(), PayrollCalculationStatus.APPROVED.name());

        // P0-4: При утверждении — добавить gross_pay в фактические затраты ФОТ бюджета
        if (calc.getBudgetId() != null) {
            updateLaborBudgetActual(calc.getBudgetId(), calc.getGrossPay(), calc.getId());
        }

        log.info("Расчёт зарплаты утверждён: {} ({})", calc.getEmployeeId(), calc.getId());
        return PayrollCalculationResponse.fromEntity(calc);
    }

    /**
     * P0-3: Расчёт зарплаты на основе данных из табеля учёта рабочего времени.
     * Автоматически агрегирует часы из одобренных записей табеля за период —
     * устраняет разрыв «Сотрудник → Табель → Зарплата».
     */
    @Transactional
    public PayrollCalculationResponse calculateFromTimesheetData(
            UUID templateId, UUID employeeId, LocalDate periodStart, LocalDate periodEnd, UUID budgetId) {

        BigDecimal workedHours = timesheetRepository.sumHoursByEmployeeAndDateRange(
                employeeId, periodStart, periodEnd, TimesheetStatus.APPROVED);
        BigDecimal overtimeHours = timesheetRepository.sumOvertimeHoursByEmployeeAndDateRange(
                employeeId, periodStart, periodEnd, TimesheetStatus.APPROVED);

        PayrollCalculateRequest request = new PayrollCalculateRequest(
                templateId, employeeId, periodStart, periodEnd,
                overtimeHours, workedHours,
                null, null, // nightHours, holidayHours — надо передать вручную
                budgetId
        );
        return calculatePayroll(request);
    }

    /**
     * P0-4: Обновление фактических расходов по статье ФОТ бюджета.
     * Находит или создаёт BudgetItem(category=LABOR, name="ФОТ") и увеличивает actualAmount.
     */
    private void updateLaborBudgetActual(UUID budgetId, BigDecimal grossPay, UUID payrollId) {
        try {
            BudgetItem laborItem = budgetItemRepository
                    .findByBudgetIdAndDeletedFalseOrderBySequenceAsc(budgetId)
                    .stream()
                    .filter(item -> item.getCategory() == BudgetCategory.LABOR && !item.isSection())
                    .findFirst()
                    .orElseGet(() -> {
                        BudgetItem newItem = BudgetItem.builder()
                                .budgetId(budgetId)
                                .category(BudgetCategory.LABOR)
                                .name("ФОТ (фактические расходы)")
                                .plannedAmount(BigDecimal.ZERO)
                                .actualAmount(BigDecimal.ZERO)
                                .build();
                        return budgetItemRepository.save(newItem);
                    });

            BigDecimal current = laborItem.getActualAmount() != null ? laborItem.getActualAmount() : BigDecimal.ZERO;
            laborItem.setActualAmount(current.add(grossPay));
            budgetItemRepository.save(laborItem);
            log.info("Бюджет ФОТ обновлён: budgetId={}, +grossPay={}, payrollId={}", budgetId, grossPay, payrollId);
        } catch (Exception e) {
            log.error("Ошибка обновления бюджета ФОТ: budgetId={}, payrollId={}", budgetId, payrollId, e);
        }
    }

    // ---- Private helpers ----

    private BigDecimal calculateBasePay(PayrollTemplate template, PayrollCalculateRequest request) {
        return switch (template.getType()) {
            case SALARY -> {
                BigDecimal salary = template.getBaseSalary() != null ? template.getBaseSalary() : BigDecimal.ZERO;
                // P1-HR-1: Prorate salary by actual worked hours vs normative hours for the period.
                // If workedHours is supplied and a period is defined, apply the ratio:
                //   basePay = salary × (workedHours / normativeHoursInMonth)
                // This implements the standard Russian payroll rule (ТК РФ ст.91, 104):
                // an employee working fewer hours than the norm receives a proportional pay.
                BigDecimal worked = request.workedHours();
                if (worked != null && worked.compareTo(BigDecimal.ZERO) > 0 && request.periodStart() != null) {
                    int year = request.periodStart().getYear();
                    int month = request.periodStart().getMonthValue();
                    BigDecimal normHours = workCalendarService.getNormativeHoursForMonth(year, month);
                    if (normHours.compareTo(BigDecimal.ZERO) > 0) {
                        BigDecimal prorated = salary
                                .multiply(worked)
                                .divide(normHours, 2, RoundingMode.HALF_UP);
                        log.debug("P1-HR-1: SALARY proration employee={} salary={} worked={} norm={} basePay={}",
                                request.employeeId(), salary, worked, normHours, prorated);
                        yield prorated;
                    }
                }
                // No workedHours provided — full salary (e.g. fully worked month).
                yield salary;
            }
            case HOURLY -> {
                BigDecimal hours = request.workedHours() != null ? request.workedHours() : BigDecimal.ZERO;
                BigDecimal rate = template.getHourlyRate() != null ? template.getHourlyRate() : BigDecimal.ZERO;
                yield hours.multiply(rate).setScale(2, RoundingMode.HALF_UP);
            }
            case PIECEWORK -> template.getBaseSalary() != null ? template.getBaseSalary() : BigDecimal.ZERO;
            case BONUS -> template.getBaseSalary() != null ? template.getBaseSalary() : BigDecimal.ZERO;
            case OVERTIME -> {
                BigDecimal hours = request.workedHours() != null ? request.workedHours() : BigDecimal.ZERO;
                BigDecimal rate = template.getHourlyRate() != null ? template.getHourlyRate() : BigDecimal.ZERO;
                yield hours.multiply(rate).setScale(2, RoundingMode.HALF_UP);
            }
        };
    }

    /**
     * ст.152 ТК РФ: сверхурочная работа оплачивается не менее чем:
     * — первые 2 часа: не менее 1.5 ставки (тарифа)
     * — последующие часы: не менее 2.0 ставки (тарифа)
     */
    private BigDecimal calculateOvertimePay(PayrollTemplate template, PayrollCalculateRequest request) {
        BigDecimal overtimeHours = request.overtimeHours() != null ? request.overtimeHours() : BigDecimal.ZERO;
        if (overtimeHours.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal rate = template.getHourlyRate() != null ? template.getHourlyRate() : BigDecimal.ZERO;
        if (rate.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal two = new BigDecimal("2");
        BigDecimal firstHours = overtimeHours.min(two);
        BigDecimal remainingHours = overtimeHours.subtract(firstHours).max(BigDecimal.ZERO);

        // Первые 2 часа — коэффициент 1.5 (ст.152 ч.1)
        BigDecimal firstTierPay = firstHours.multiply(rate)
                .multiply(new BigDecimal("1.5")).setScale(2, RoundingMode.HALF_UP);
        // Последующие часы — коэффициент 2.0 (ст.152 ч.1)
        BigDecimal secondTierPay = remainingHours.multiply(rate)
                .multiply(new BigDecimal("2.0")).setScale(2, RoundingMode.HALF_UP);

        return firstTierPay.add(secondTierPay);
    }

    /**
     * ст.154 ТК РФ: каждый час работы в ночное время (22:00–06:00) оплачивается
     * в повышенном размере — не менее 20% часовой тарифной ставки.
     */
    private BigDecimal calculateNightPay(BigDecimal rate, PayrollCalculateRequest request) {
        BigDecimal nightHours = request.nightHours() != null ? request.nightHours() : BigDecimal.ZERO;
        if (nightHours.compareTo(BigDecimal.ZERO) <= 0 || rate.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        // Доплата = ночные часы × ставка × 20%
        return nightHours.multiply(rate)
                .multiply(new BigDecimal("0.20")).setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * ст.153 ТК РФ: работа в выходной или нерабочий праздничный день оплачивается
     * не менее чем в двойном размере.
     * Сотрудник уже получает 1× в составе basePay (если holidayHours включены в workedHours),
     * поэтому доплата составляет ещё 1× (итого 2×).
     */
    private BigDecimal calculateHolidayPay(BigDecimal rate, PayrollCalculateRequest request) {
        BigDecimal holidayHours = request.holidayHours() != null ? request.holidayHours() : BigDecimal.ZERO;
        if (holidayHours.compareTo(BigDecimal.ZERO) <= 0 || rate.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        // Доплата = праздничные часы × ставка × 1.0 (до двойного размера)
        return holidayHours.multiply(rate).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateBonusPay(PayrollTemplate template, BigDecimal basePay) {
        BigDecimal bonusPercent = template.getBonusPercentage() != null
                ? template.getBonusPercentage() : BigDecimal.ZERO;
        if (bonusPercent.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return basePay.multiply(bonusPercent)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateDeduction(BigDecimal grossPay, BigDecimal rate) {
        if (rate == null || rate.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return grossPay.multiply(rate)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    /**
     * P1-HR-2: Прогрессивный НДФЛ — НК РФ ст.224 (ред. Федерального закона №176-ФЗ от 12.07.2024).
     * Налоговые ставки с 2025 г.:
     *   13%  — доход до 2 400 000 руб./год
     *   15%  — доход от 2 400 001 до 5 000 000 руб./год
     *   18%  — доход от 5 000 001 до 20 000 000 руб./год
     *   20%  — доход от 20 000 001 до 50 000 000 руб./год
     *   22%  — доход свыше 50 000 000 руб./год
     *
     * Метод: рассчитывает НДФЛ с grossPay, учитывая cumulative доход с начала года.
     */
    private BigDecimal calculateProgressiveNdfl(BigDecimal grossPay, PayrollCalculateRequest request) {
        // Получаем суммарный доход сотрудника с начала налогового года до текущего периода
        LocalDate periodStart = request.periodStart() != null ? request.periodStart() : LocalDate.now();
        LocalDate yearStart = LocalDate.of(periodStart.getYear(), 1, 1);

        BigDecimal cumulativeIncome = BigDecimal.ZERO;
        if (request.employeeId() != null) {
            cumulativeIncome = calculationRepository.sumGrossPayForEmployee(
                    request.employeeId(), yearStart, periodStart);
        }

        // Прогрессивный расчёт методом «послойного» налогообложения
        final BigDecimal BRACKET_1 = new BigDecimal("2400000");  // 13%
        final BigDecimal BRACKET_2 = new BigDecimal("5000000");  // 15%
        final BigDecimal BRACKET_3 = new BigDecimal("20000000"); // 18%
        final BigDecimal BRACKET_4 = new BigDecimal("50000000"); // 20%
        // > 50M — 22%

        final BigDecimal RATE_1 = new BigDecimal("0.13");
        final BigDecimal RATE_2 = new BigDecimal("0.15");
        final BigDecimal RATE_3 = new BigDecimal("0.18");
        final BigDecimal RATE_4 = new BigDecimal("0.20");
        final BigDecimal RATE_5 = new BigDecimal("0.22");

        BigDecimal tax = BigDecimal.ZERO;
        BigDecimal remaining = grossPay;
        BigDecimal cursor = cumulativeIncome; // текущая позиция в налоговой шкале

        // Считаем налог послойно, начиная с того места, где cursor находится в шкале
        BigDecimal[][] brackets = {
                {BRACKET_1, RATE_1},
                {BRACKET_2, RATE_2},
                {BRACKET_3, RATE_3},
                {BRACKET_4, RATE_4},
                {new BigDecimal("999999999"), RATE_5} // условная верхняя граница
        };

        BigDecimal prevBracket = BigDecimal.ZERO;
        for (BigDecimal[] bracket : brackets) {
            BigDecimal bracketTop = bracket[0];
            BigDecimal rate = bracket[1];

            if (cursor.compareTo(bracketTop) >= 0) {
                prevBracket = bracketTop;
                continue; // cursor уже выше этого диапазона
            }

            // Сколько ещё умещается в текущем диапазоне
            BigDecimal roomInBracket = bracketTop.subtract(cursor.max(prevBracket));
            BigDecimal taxableInBracket = remaining.min(roomInBracket);

            tax = tax.add(taxableInBracket.multiply(rate).setScale(2, RoundingMode.HALF_UP));
            remaining = remaining.subtract(taxableInBracket);

            cursor = cursor.add(taxableInBracket);
            prevBracket = bracketTop;

            if (remaining.compareTo(BigDecimal.ZERO) <= 0) break;
        }

        log.debug("НДФЛ прогрессивный: сотрудник={}, grossPay={}, cumulativeIncome={}, НДФЛ={}",
                request.employeeId(), grossPay, cumulativeIncome, tax);
        return tax;
    }

    /**
     * P1-HR-3: Взносы на ОПС — Федеральный закон №178-ФЗ (2025).
     * Единая предельная база для ОПС: 2 225 000 руб./год.
     *   До порога:    22% с grossPay
     *   Выше порога:  10% с grossPay
     *   Частично:     22% с суммы до порога + 10% с суммы сверх порога
     *
     * @param grossPay              начисления за текущий расчётный период
     * @param cumulativeAnnualIncome суммарный доход сотрудника с начала года ДО текущего периода
     */
    private BigDecimal calculatePensionContribution(BigDecimal grossPay, BigDecimal cumulativeAnnualIncome) {
        final BigDecimal OPS_THRESHOLD = new BigDecimal("2225000"); // ФЗ-178, 2025
        final BigDecimal RATE_BELOW    = new BigDecimal("0.22");
        final BigDecimal RATE_ABOVE    = new BigDecimal("0.10");

        if (cumulativeAnnualIncome == null) {
            cumulativeAnnualIncome = BigDecimal.ZERO;
        }

        // Уже превысили порог до этого периода — всё начисление по пониженной ставке
        if (cumulativeAnnualIncome.compareTo(OPS_THRESHOLD) >= 0) {
            BigDecimal ops = grossPay.multiply(RATE_ABOVE).setScale(2, RoundingMode.HALF_UP);
            log.debug("ОПС: выше порога — сотрудник=({}), grossPay={}, OPS={}",
                    cumulativeAnnualIncome, grossPay, ops);
            return ops;
        }

        // Ещё не достигли порога — считаем послойно
        BigDecimal roomBelow = OPS_THRESHOLD.subtract(cumulativeAnnualIncome); // сколько «умещается» до порога
        BigDecimal belowThreshold = grossPay.min(roomBelow);
        BigDecimal aboveThreshold = grossPay.subtract(belowThreshold).max(BigDecimal.ZERO);

        BigDecimal opsBelowPart = belowThreshold.multiply(RATE_BELOW).setScale(2, RoundingMode.HALF_UP);
        BigDecimal opsAbovePart = aboveThreshold.multiply(RATE_ABOVE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal ops = opsBelowPart.add(opsAbovePart);

        log.debug("ОПС: послойный расчёт — cumulative={}, grossPay={}, belowPart={} (22%), abovePart={} (10%), OPS={}",
                cumulativeAnnualIncome, grossPay, belowThreshold, aboveThreshold, ops);
        return ops;
    }

    private PayrollTemplate getTemplateOrThrow(UUID id) {
        return templateRepository.findById(id)
                .filter(t -> !t.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Шаблон расчёта зарплаты не найден: " + id));
    }

    private PayrollCalculation getCalculationOrThrow(UUID id) {
        return calculationRepository.findById(id)
                .filter(c -> !c.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Расчёт зарплаты не найден: " + id));
    }

    private void validatePeriod(java.time.LocalDate start, java.time.LocalDate end) {
        if (start != null && end != null && end.isBefore(start)) {
            throw new IllegalArgumentException("Конец периода должен быть позже начала периода");
        }
    }
}
