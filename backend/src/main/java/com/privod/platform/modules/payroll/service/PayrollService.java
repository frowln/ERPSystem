package com.privod.platform.modules.payroll.service;

import com.privod.platform.infrastructure.audit.AuditService;
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PayrollService {

    private final PayrollTemplateRepository templateRepository;
    private final PayrollCalculationRepository calculationRepository;
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
        BigDecimal grossPay = basePay.add(overtimePay).add(bonusPay);

        BigDecimal taxDeduction = calculateDeduction(grossPay, template.getTaxRate());
        BigDecimal pensionDeduction = calculateDeduction(grossPay, template.getPensionRate());
        BigDecimal socialDeduction = calculateDeduction(grossPay, template.getSocialRate());
        BigDecimal medicalDeduction = calculateDeduction(grossPay, template.getMedicalRate());
        BigDecimal totalDeductions = taxDeduction.add(pensionDeduction)
                .add(socialDeduction).add(medicalDeduction);
        BigDecimal netPay = grossPay.subtract(taxDeduction);

        PayrollCalculation calc = PayrollCalculation.builder()
                .templateId(template.getId())
                .employeeId(request.employeeId())
                .periodStart(request.periodStart())
                .periodEnd(request.periodEnd())
                .basePay(basePay)
                .overtimePay(overtimePay)
                .bonusPay(bonusPay)
                .grossPay(grossPay)
                .taxDeduction(taxDeduction)
                .pensionDeduction(pensionDeduction)
                .socialDeduction(socialDeduction)
                .medicalDeduction(medicalDeduction)
                .totalDeductions(totalDeductions)
                .netPay(netPay)
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

        log.info("Расчёт зарплаты утверждён: {} ({})", calc.getEmployeeId(), calc.getId());
        return PayrollCalculationResponse.fromEntity(calc);
    }

    // ---- Private helpers ----

    private BigDecimal calculateBasePay(PayrollTemplate template, PayrollCalculateRequest request) {
        return switch (template.getType()) {
            case SALARY -> template.getBaseSalary() != null ? template.getBaseSalary() : BigDecimal.ZERO;
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

    private BigDecimal calculateOvertimePay(PayrollTemplate template, PayrollCalculateRequest request) {
        BigDecimal overtimeHours = request.overtimeHours() != null ? request.overtimeHours() : BigDecimal.ZERO;
        if (overtimeHours.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal rate = template.getHourlyRate() != null ? template.getHourlyRate() : BigDecimal.ZERO;
        BigDecimal multiplier = template.getOvertimeMultiplier() != null
                ? template.getOvertimeMultiplier() : new BigDecimal("1.50");
        return overtimeHours.multiply(rate).multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
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
