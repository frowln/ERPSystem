package com.privod.platform.modules.hrRussian.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.hr.domain.Employee;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import com.privod.platform.modules.hrRussian.domain.MilitaryRecord;
import com.privod.platform.modules.hrRussian.domain.PersonalCard;
import com.privod.platform.modules.hrRussian.domain.Vacation;
import com.privod.platform.modules.hrRussian.repository.MilitaryRecordRepository;
import com.privod.platform.modules.hrRussian.repository.PersonalCardRepository;
import com.privod.platform.modules.hrRussian.repository.VacationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Сервис для работы с личными карточками (Форма Т-2).
 *
 * Форма Т-2 утверждена Постановлением Госкомстата России №1 от 05.01.2004.
 * Содержит 11 разделов согласно Указаниям по применению унифицированных форм.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PersonalCardService {

    private final PersonalCardRepository personalCardRepository;
    private final EmployeeRepository employeeRepository;
    private final MilitaryRecordRepository militaryRecordRepository;
    private final VacationRepository vacationRepository;
    private final ObjectMapper objectMapper;
    private final AuditService auditService;

    /**
     * Генерирует (или обновляет) данные Формы Т-2 для сотрудника.
     *
     * Структура разделов по Постановлению Госкомстата №1 от 05.01.2004:
     *   Раздел I   — Общие сведения
     *   Раздел II  — Сведения о воинском учёте
     *   Раздел III — Приём на работу и переводы на другую работу
     *   Раздел IV  — Аттестация
     *   Раздел V   — Повышение квалификации
     *   Раздел VI  — Профессиональная переподготовка
     *   Раздел VII — Награды (поощрения), почётные звания
     *   Раздел VIII — Отпуск
     *   Раздел IX  — Социальные льготы
     *   Раздел X   — Дополнительные сведения
     *   Раздел XI  — Основание прекращения трудового договора (подпись)
     *
     * @param employeeId идентификатор сотрудника
     * @return обновлённая PersonalCard с заполненным formT2Data
     */
    @Transactional
    public PersonalCard generateFormT2(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .filter(e -> !e.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Сотрудник не найден: " + employeeId));

        PersonalCard card = personalCardRepository
                .findByEmployeeIdAndDeletedFalse(employeeId)
                .orElseGet(() -> {
                    PersonalCard newCard = PersonalCard.builder()
                            .employeeId(employeeId)
                            .organizationId(employee.getOrganizationId())
                            .formT2Data("{}")
                            .build();
                    return personalCardRepository.save(newCard);
                });

        Optional<MilitaryRecord> militaryRecord =
                militaryRecordRepository.findByEmployeeIdAndDeletedFalse(employeeId);
        List<Vacation> vacations =
                vacationRepository.findByEmployeeIdAndDeletedFalseOrderByStartDateDesc(employeeId);

        Map<String, Object> t2 = buildFormT2(employee, militaryRecord.orElse(null), vacations);

        try {
            card.setFormT2Data(objectMapper.writeValueAsString(t2));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Ошибка сериализации данных Формы Т-2: " + e.getMessage(), e);
        }

        card = personalCardRepository.save(card);
        auditService.logUpdate("PersonalCard", card.getId(), "formT2Data", null, null);

        log.info("Форма Т-2 сформирована: сотрудник={}, карточка={}", employeeId, card.getId());
        return card;
    }

    /**
     * Возвращает текущую PersonalCard сотрудника или бросает исключение.
     */
    @Transactional(readOnly = true)
    public PersonalCard getCard(UUID employeeId) {
        return personalCardRepository.findByEmployeeIdAndDeletedFalse(employeeId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Личная карточка Т-2 не найдена для сотрудника: " + employeeId));
    }

    // ---- Private builder ----

    private Map<String, Object> buildFormT2(Employee employee,
                                             MilitaryRecord military,
                                             List<Vacation> vacations) {
        Map<String, Object> form = new LinkedHashMap<>();
        form.put("formCode", "0301002");
        form.put("formName", "Личная карточка работника (Форма Т-2)");
        form.put("generatedAt", LocalDate.now().toString());

        // Раздел I: Общие сведения
        form.put("section1", buildSection1(employee));

        // Раздел II: Сведения о воинском учёте
        form.put("section2", buildSection2(military));

        // Раздел III: Приём на работу и переводы на другую работу
        form.put("section3", buildSection3(employee));

        // Раздел IV: Аттестация
        form.put("section4", buildSection4());

        // Раздел V: Повышение квалификации
        form.put("section5", buildSection5());

        // Раздел VI: Профессиональная переподготовка
        form.put("section6", buildSection6());

        // Раздел VII: Награды (поощрения), почётные звания
        form.put("section7", buildSection7());

        // Раздел VIII: Отпуск
        form.put("section8", buildSection8(vacations));

        // Раздел IX: Социальные льготы
        form.put("section9", buildSection9());

        // Раздел X: Дополнительные сведения
        form.put("section10", buildSection10(employee));

        // Раздел XI: Основание прекращения трудового договора (увольнения)
        form.put("section11", buildSection11(employee));

        return form;
    }

    /**
     * Раздел I — Общие сведения.
     * Фамилия, имя, отчество; дата рождения; место рождения; гражданство; образование.
     */
    private Map<String, Object> buildSection1(Employee employee) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("lastName", employee.getLastName());
        s.put("firstName", employee.getFirstName());
        s.put("middleName", employee.getMiddleName());
        s.put("fullName", employee.getFullName());
        s.put("employeeNumber", employee.getEmployeeNumber());
        s.put("position", employee.getPosition());
        s.put("hireDate", employee.getHireDate() != null ? employee.getHireDate().toString() : null);
        // Дополнительные демографические поля (заполняются вручную через UI)
        s.put("birthDate", null);
        s.put("birthPlace", null);
        s.put("nationality", null);
        s.put("education", null);           // Уровень образования
        s.put("educationInstitution", null); // Учебное заведение
        s.put("specialty", null);            // Специальность по образованию
        s.put("diplomaNumber", null);        // Серия и номер документа
        s.put("diplomaYear", null);          // Год окончания
        s.put("maritalStatus", null);        // Семейное положение
        s.put("dependantsCount", null);      // Количество иждивенцев
        return s;
    }

    /**
     * Раздел II — Сведения о воинском учёте (Постановление Правительства РФ №719).
     * Заполняется из MilitaryRecord если существует.
     */
    private Map<String, Object> buildSection2(MilitaryRecord military) {
        Map<String, Object> s = new LinkedHashMap<>();
        if (military == null) {
            s.put("militaryRegistrationRequired", false);
            s.put("category", null);
            s.put("rank", null);
            s.put("specialty", null);
            s.put("fitnessCategory", null);
            s.put("registrationOffice", null);
            s.put("isRegistered", false);
        } else {
            s.put("militaryRegistrationRequired", true);
            // Поля зашифрованы в БД (EncryptedFieldConverter), читаются расшифрованными
            s.put("category", military.getCategory());
            s.put("rank", military.getRank());
            s.put("specialty", military.getSpecialty());
            s.put("fitnessCategory", military.getFitnessCategory());
            s.put("registrationOffice", military.getRegistrationOffice());
            s.put("isRegistered", military.isRegistered());
        }
        return s;
    }

    /**
     * Раздел III — Приём на работу и переводы.
     * Текущая запись о приёме из данных сотрудника; история переводов добавляется через UI.
     */
    private Map<String, Object> buildSection3(Employee employee) {
        Map<String, Object> s = new LinkedHashMap<>();
        List<Map<String, Object>> entries = new ArrayList<>();
        // Запись о первоначальном приёме
        if (employee.getHireDate() != null) {
            Map<String, Object> hire = new LinkedHashMap<>();
            hire.put("date", employee.getHireDate().toString());
            hire.put("structuralUnit", null);       // Структурное подразделение
            hire.put("position", employee.getPosition());
            hire.put("tariffRate", null);            // Тарифная ставка (оклад)
            hire.put("orderNumber", null);           // Номер и дата приказа
            hire.put("orderDate", null);
            entries.add(hire);
        }
        s.put("employmentHistory", entries);
        return s;
    }

    /**
     * Раздел IV — Аттестация.
     * Периодическая аттестация работника (даты, решения комиссии).
     * Заполняется вручную или через модуль аттестации.
     */
    private Map<String, Object> buildSection4() {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("attestationRecords", new ArrayList<>());
        // Каждая запись: { date, decision, protocol, nextAttestationDate }
        return s;
    }

    /**
     * Раздел V — Повышение квалификации.
     * Сведения об обучении по курсам повышения квалификации.
     */
    private Map<String, Object> buildSection5() {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("qualificationRecords", new ArrayList<>());
        // Каждая запись: { startDate, endDate, institution, programType, diplomaNumber }
        return s;
    }

    /**
     * Раздел VI — Профессиональная переподготовка.
     * Сведения о переподготовке (смена специальности).
     */
    private Map<String, Object> buildSection6() {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("retrainingRecords", new ArrayList<>());
        // Каждая запись: { startDate, endDate, institution, newSpecialty, diplomaNumber }
        return s;
    }

    /**
     * Раздел VII — Награды (поощрения), почётные звания.
     * Государственные и ведомственные награды.
     */
    private Map<String, Object> buildSection7() {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("awards", new ArrayList<>());
        // Каждая запись: { awardName, orderNumber, orderDate }
        return s;
    }

    /**
     * Раздел VIII — Отпуск.
     * Заполняется из записей Vacation (все типы отпусков сотрудника).
     */
    private Map<String, Object> buildSection8(List<Vacation> vacations) {
        Map<String, Object> s = new LinkedHashMap<>();
        List<Map<String, Object>> leaveRecords = new ArrayList<>();
        for (Vacation v : vacations) {
            Map<String, Object> record = new LinkedHashMap<>();
            record.put("vacationType", v.getVacationType() != null ? v.getVacationType().name() : null);
            record.put("periodStart", v.getStartDate() != null ? v.getStartDate().toString() : null);
            record.put("periodEnd", v.getEndDate() != null ? v.getEndDate().toString() : null);
            record.put("daysCount", v.getDaysCount());
            record.put("status", v.getStatus() != null ? v.getStatus().name() : null);
            record.put("vacationPay", v.getVacationPay());
            record.put("averageDailyEarnings", v.getAverageDailyEarnings());
            record.put("orderNumber", null); // Номер приказа (заполняется вручную)
            leaveRecords.add(record);
        }
        s.put("leaveRecords", leaveRecords);
        return s;
    }

    /**
     * Раздел IX — Социальные льготы.
     * Право на льготы, установленные законодательством.
     */
    private Map<String, Object> buildSection9() {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("socialBenefits", new ArrayList<>());
        // Каждая запись: { benefitCode, benefitName, documentName, documentNumber, documentDate }
        return s;
    }

    /**
     * Раздел X — Дополнительные сведения.
     * Иностранные языки, учёные степени, инвалидность и пр.
     */
    private Map<String, Object> buildSection10(Employee employee) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("notes", employee.getNotes());
        s.put("additionalInfo", new ArrayList<>());
        // Каждая запись: { key, value }
        return s;
    }

    /**
     * Раздел XI — Основание прекращения трудового договора.
     * Статья ТК РФ, номер и дата приказа; дата увольнения.
     */
    private Map<String, Object> buildSection11(Employee employee) {
        Map<String, Object> s = new LinkedHashMap<>();
        s.put("terminationDate",
                employee.getTerminationDate() != null ? employee.getTerminationDate().toString() : null);
        s.put("terminationBasis", null);    // Статья ТК РФ
        s.put("terminationOrderNumber", null);
        s.put("terminationOrderDate", null);
        s.put("employeeSignature", null);   // Подпись работника (метка наличия)
        s.put("hrSignature", null);         // Подпись сотрудника ОК
        return s;
    }
}
