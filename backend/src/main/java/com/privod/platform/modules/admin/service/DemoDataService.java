package com.privod.platform.modules.admin.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DemoDataService {

    private final JdbcTemplate jdbcTemplate;

    @Data
    public static class DemoDataResult {
        private int createdCount = 0;
        private Map<String, Integer> modules = new HashMap<>();

        public void increment(String module) {
            createdCount++;
            modules.merge(module, 1, Integer::sum);
        }
    }

    @Transactional
    public DemoDataResult seedAllModules() {
        DemoDataResult result = new DemoDataResult();
        UUID orgId = SecurityUtils.getCurrentOrganizationId().orElse(null);

        seedCounterparties(result, orgId);
        seedProject(result, orgId);
        seedEmployees(result, orgId);
        seedTasks(result, orgId);

        log.info("Demo data seeded: {} records across {} modules",
                result.getCreatedCount(), result.getModules().size());
        return result;
    }

    @Transactional
    public int clearDemoData() {
        int count = 0;
        count += jdbcTemplate.update("DELETE FROM tasks WHERE title LIKE 'DEMO-%'");
        count += jdbcTemplate.update("DELETE FROM projects WHERE name LIKE 'DEMO-%'");
        count += jdbcTemplate.update("DELETE FROM counterparties WHERE short_name LIKE 'DEMO-%'");
        count += jdbcTemplate.update("DELETE FROM employees WHERE last_name LIKE 'DEMO-%'");
        log.info("Demo data cleared: {} records deleted", count);
        return count;
    }

    private void seedCounterparties(DemoDataResult result, UUID orgId) {
        String[][] counterparties = {
                {"DEMO-Стройресурс", "7701234567", "Поставщик стройматериалов"},
                {"DEMO-ТехноПром", "7707654321", "Субподрядчик электромонтажных работ"},
                {"DEMO-МеталлСтрой", "7710111213", "Поставщик металлоконструкций"},
                {"DEMO-АрмСтройПроект", "7712345678", "Проектная организация"},
                {"DEMO-ЭнергоСеть", "7715678901", "Субподрядчик электрических сетей"},
        };
        for (String[] cp : counterparties) {
            try {
                jdbcTemplate.update(
                        "INSERT INTO counterparties (id, short_name, inn, description, organization_id, deleted, created_at, updated_at) " +
                                "VALUES (gen_random_uuid(), ?, ?, ?, ?, false, NOW(), NOW()) " +
                                "ON CONFLICT DO NOTHING",
                        cp[0], cp[1], cp[2], orgId
                );
                result.increment("counterparties");
            } catch (Exception e) {
                log.debug("Counterparty {} already exists or insert failed: {}", cp[0], e.getMessage());
            }
        }
    }

    private void seedProject(DemoDataResult result, UUID orgId) {
        try {
            jdbcTemplate.update(
                    "INSERT INTO projects (id, code, name, description, status, planned_start_date, planned_end_date, " +
                            "organization_id, priority, deleted, created_at, updated_at) " +
                            "VALUES (gen_random_uuid(), 'DEMO-001', 'DEMO-ЖК Привод Тауэр', 'Демо-проект: жилой комплекс', " +
                            "'IN_PROGRESS', CURRENT_DATE - 30, CURRENT_DATE + 365, ?, 'NORMAL', false, NOW(), NOW()) " +
                            "ON CONFLICT DO NOTHING",
                    orgId
            );
            result.increment("projects");
        } catch (Exception e) {
            log.debug("Demo project already exists or insert failed: {}", e.getMessage());
        }
    }

    private void seedEmployees(DemoDataResult result, UUID orgId) {
        String[][] employees = {
                {"DEMO-Иванов", "Пётр", "Сергеевич", "Прораб"},
                {"DEMO-Петрова", "Мария", "Ивановна", "Бухгалтер"},
                {"DEMO-Сидоров", "Алексей", "Николаевич", "Инженер ПТО"},
                {"DEMO-Козлова", "Елена", "Михайловна", "Менеджер по закупкам"},
                {"DEMO-Морозов", "Дмитрий", "Александрович", "Специалист по ОТ"},
        };
        for (String[] emp : employees) {
            try {
                jdbcTemplate.update(
                        "INSERT INTO employees (id, last_name, first_name, middle_name, position, organization_id, deleted, created_at, updated_at) " +
                                "VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, false, NOW(), NOW()) " +
                                "ON CONFLICT DO NOTHING",
                        emp[0], emp[1], emp[2], emp[3], orgId
                );
                result.increment("employees");
            } catch (Exception e) {
                log.debug("Employee {} already exists or insert failed: {}", emp[0], e.getMessage());
            }
        }
    }

    private void seedTasks(DemoDataResult result, UUID orgId) {
        String[][] tasks = {
                {"DEMO-Подготовка площадки", "BACKLOG"},
                {"DEMO-Фундаментные работы", "IN_PROGRESS"},
                {"DEMO-Монтаж каркаса", "BACKLOG"},
                {"DEMO-Кровельные работы", "BACKLOG"},
                {"DEMO-Отделочные работы", "BACKLOG"},
        };
        for (String[] task : tasks) {
            try {
                jdbcTemplate.update(
                        "INSERT INTO tasks (id, title, status, organization_id, deleted, created_at, updated_at) " +
                                "VALUES (gen_random_uuid(), ?, ?, ?, false, NOW(), NOW()) " +
                                "ON CONFLICT DO NOTHING",
                        task[0], task[1], orgId
                );
                result.increment("tasks");
            } catch (Exception e) {
                log.debug("Task {} already exists or insert failed: {}", task[0], e.getMessage());
            }
        }
    }
}
