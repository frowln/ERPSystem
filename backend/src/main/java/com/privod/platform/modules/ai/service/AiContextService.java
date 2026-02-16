package com.privod.platform.modules.ai.service;

import com.privod.platform.modules.contract.repository.ContractRepository;
import com.privod.platform.modules.hr.repository.EmployeeRepository;
import com.privod.platform.modules.project.domain.Project;
import com.privod.platform.modules.project.repository.ProjectRepository;
import com.privod.platform.modules.task.repository.ProjectTaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service that analyzes user messages for data-related intent
 * and builds context from the platform database to inject into AI prompts.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiContextService {

    private final ProjectRepository projectRepository;
    private final ProjectTaskRepository taskRepository;
    private final ContractRepository contractRepository;
    private final EmployeeRepository employeeRepository;

    // Patterns for intent detection (Russian + English keywords)
    private static final Pattern PROJECT_COUNT_PATTERN = Pattern.compile(
            "(?i)(сколько|количество|число|count|how many).{0,30}(проект|project)", Pattern.UNICODE_CASE);
    private static final Pattern PROJECT_LIST_PATTERN = Pattern.compile(
            "(?i)(список|покажи|перечисли|list|show).{0,30}(проект|project)", Pattern.UNICODE_CASE);
    private static final Pattern PROJECT_BUDGET_PATTERN = Pattern.compile(
            "(?i)(бюджет|budget|сумма|стоимость|cost).{0,30}(проект|project)|" +
            "(проект|project).{0,30}(бюджет|budget|сумма|стоимость|cost)", Pattern.UNICODE_CASE);
    private static final Pattern PROJECT_SEARCH_PATTERN = Pattern.compile(
            "(?i)(проект|project)\\s+[\"«]?([^\"»]{2,50})[\"»]?", Pattern.UNICODE_CASE);
    private static final Pattern TASK_COUNT_PATTERN = Pattern.compile(
            "(?i)(сколько|количество|число|count|how many).{0,30}(задач|task|заданий)", Pattern.UNICODE_CASE);
    private static final Pattern TASK_STATUS_PATTERN = Pattern.compile(
            "(?i)(статус|status|состояние).{0,30}(задач|task)|" +
            "(задач|task).{0,30}(статус|status|по статус)", Pattern.UNICODE_CASE);
    private static final Pattern TASK_OVERDUE_PATTERN = Pattern.compile(
            "(?i)(просрочен|overdue|опоздан|задержк|delayed).{0,30}(задач|task)|" +
            "(задач|task).{0,30}(просрочен|overdue|опоздан|задержк|delayed)", Pattern.UNICODE_CASE);
    private static final Pattern CONTRACT_PATTERN = Pattern.compile(
            "(?i)(контракт|договор|contract|подряд)", Pattern.UNICODE_CASE);
    private static final Pattern EMPLOYEE_PATTERN = Pattern.compile(
            "(?i)(сотрудник|работник|персонал|employee|staff|кадр)", Pattern.UNICODE_CASE);
    private static final Pattern SUMMARY_PATTERN = Pattern.compile(
            "(?i)(обзор|сводка|summary|дашборд|dashboard|общая.{0,10}информация|итог)", Pattern.UNICODE_CASE);

    /**
     * Analyze user message and build relevant context from the database.
     * Returns null if no data-related intent is detected.
     */
    @Transactional(readOnly = true)
    public String buildContext(String userMessage, UUID userId) {
        if (userMessage == null || userMessage.isBlank()) {
            return null;
        }

        List<String> contextParts = new ArrayList<>();

        try {
            // Check for summary/dashboard intent first
            if (SUMMARY_PATTERN.matcher(userMessage).find()) {
                contextParts.add(buildPlatformSummary());
            }

            // Project-related intents
            if (PROJECT_COUNT_PATTERN.matcher(userMessage).find()) {
                contextParts.add(buildProjectCountContext());
            }
            if (PROJECT_LIST_PATTERN.matcher(userMessage).find()) {
                contextParts.add(buildProjectListContext());
            }
            if (PROJECT_BUDGET_PATTERN.matcher(userMessage).find()) {
                contextParts.add(buildProjectBudgetContext());
            }
            // Search for specific project by name
            Matcher projectSearch = PROJECT_SEARCH_PATTERN.matcher(userMessage);
            if (projectSearch.find()) {
                String searchTerm = projectSearch.group(2).trim();
                if (searchTerm.length() >= 2 && !isCommonWord(searchTerm)) {
                    contextParts.add(buildProjectSearchContext(searchTerm));
                }
            }

            // Task-related intents
            if (TASK_COUNT_PATTERN.matcher(userMessage).find()) {
                contextParts.add(buildTaskCountContext());
            }
            if (TASK_STATUS_PATTERN.matcher(userMessage).find()) {
                contextParts.add(buildTaskStatusContext());
            }
            if (TASK_OVERDUE_PATTERN.matcher(userMessage).find()) {
                contextParts.add(buildOverdueTasksContext());
            }

            // Contract-related intents
            if (CONTRACT_PATTERN.matcher(userMessage).find()) {
                contextParts.add(buildContractContext());
            }

            // Employee-related intents
            if (EMPLOYEE_PATTERN.matcher(userMessage).find()) {
                contextParts.add(buildEmployeeContext(userMessage));
            }

        } catch (Exception e) {
            log.warn("Error building AI context from database: {}", e.getMessage(), e);
        }

        if (contextParts.isEmpty()) {
            return null;
        }

        return String.join("\n\n", contextParts);
    }

    // ========================================================================
    // Context builders
    // ========================================================================

    private String buildPlatformSummary() {
        StringBuilder sb = new StringBuilder("СВОДКА ПО ПЛАТФОРМЕ:\n");

        long projectCount = projectRepository.countActiveProjects();
        sb.append("- Всего проектов: ").append(projectCount).append("\n");

        List<Object[]> projectsByStatus = projectRepository.countByStatus();
        sb.append("- Проекты по статусам: ");
        for (Object[] row : projectsByStatus) {
            sb.append(row[0]).append("=").append(row[1]).append(" ");
        }
        sb.append("\n");

        BigDecimal totalBudget = projectRepository.sumBudgetAmount();
        if (totalBudget != null) {
            sb.append("- Общий бюджет проектов: ").append(formatMoney(totalBudget)).append(" руб.\n");
        }

        BigDecimal totalContract = projectRepository.sumContractAmount();
        if (totalContract != null) {
            sb.append("- Общая сумма контрактов: ").append(formatMoney(totalContract)).append(" руб.\n");
        }

        long taskCount = taskRepository.countActiveTasks(null);
        sb.append("- Всего задач: ").append(taskCount).append("\n");

        List<Object[]> tasksByStatus = taskRepository.countByStatusAndProjectId(null);
        sb.append("- Задачи по статусам: ");
        for (Object[] row : tasksByStatus) {
            sb.append(row[0]).append("=").append(row[1]).append(" ");
        }
        sb.append("\n");

        long contractCount = contractRepository.countActiveContracts(null);
        sb.append("- Всего контрактов: ").append(contractCount);

        return sb.toString();
    }

    private String buildProjectCountContext() {
        long count = projectRepository.countActiveProjects();
        List<Object[]> byStatus = projectRepository.countByStatus();

        StringBuilder sb = new StringBuilder();
        sb.append("КОЛИЧЕСТВО ПРОЕКТОВ: ").append(count).append("\n");
        sb.append("По статусам:\n");
        for (Object[] row : byStatus) {
            sb.append("  - ").append(row[0]).append(": ").append(row[1]).append("\n");
        }
        return sb.toString();
    }

    private String buildProjectListContext() {
        Page<Project> projects = projectRepository.findAll(
                PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createdAt")));

        StringBuilder sb = new StringBuilder("СПИСОК ПРОЕКТОВ (последние 20):\n");
        for (Project p : projects.getContent()) {
            sb.append("  - [").append(p.getCode()).append("] ")
                    .append(p.getName())
                    .append(" | Статус: ").append(p.getStatus())
                    .append(" | Бюджет: ").append(p.getBudgetAmount() != null ? formatMoney(p.getBudgetAmount()) + " руб." : "не указан");
            if (p.getPlannedStartDate() != null) {
                sb.append(" | Начало: ").append(p.getPlannedStartDate());
            }
            if (p.getPlannedEndDate() != null) {
                sb.append(" | Окончание: ").append(p.getPlannedEndDate());
            }
            sb.append("\n");
        }
        sb.append("Всего проектов: ").append(projects.getTotalElements());
        return sb.toString();
    }

    private String buildProjectBudgetContext() {
        BigDecimal totalBudget = projectRepository.sumBudgetAmount();
        BigDecimal totalContract = projectRepository.sumContractAmount();

        StringBuilder sb = new StringBuilder("ФИНАНСОВЫЕ ДАННЫЕ ПРОЕКТОВ:\n");
        sb.append("  - Общий бюджет: ").append(totalBudget != null ? formatMoney(totalBudget) + " руб." : "не указан").append("\n");
        sb.append("  - Общая сумма контрактов: ").append(totalContract != null ? formatMoney(totalContract) + " руб." : "не указана").append("\n");

        // Top 10 projects by budget
        Page<Project> topProjects = projectRepository.findAll(
                PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "budgetAmount")));
        sb.append("ТОП-10 проектов по бюджету:\n");
        for (Project p : topProjects.getContent()) {
            if (p.getBudgetAmount() != null && p.getBudgetAmount().compareTo(BigDecimal.ZERO) > 0) {
                sb.append("  - [").append(p.getCode()).append("] ").append(p.getName())
                        .append(": ").append(formatMoney(p.getBudgetAmount())).append(" руб.\n");
            }
        }
        return sb.toString();
    }

    private String buildProjectSearchContext(String searchTerm) {
        Page<Project> results = projectRepository.searchByName(
                searchTerm, PageRequest.of(0, 5));

        if (results.isEmpty()) {
            return "Проекты по запросу \"" + searchTerm + "\": не найдены.";
        }

        StringBuilder sb = new StringBuilder("РЕЗУЛЬТАТЫ ПОИСКА ПРОЕКТОВ по \"" + searchTerm + "\":\n");
        for (Project p : results.getContent()) {
            sb.append("  - [").append(p.getCode()).append("] ").append(p.getName())
                    .append(" | Статус: ").append(p.getStatus())
                    .append(" | Бюджет: ").append(p.getBudgetAmount() != null ? formatMoney(p.getBudgetAmount()) + " руб." : "не указан");
            if (p.getCity() != null) {
                sb.append(" | Город: ").append(p.getCity());
            }
            if (p.getDescription() != null && !p.getDescription().isBlank()) {
                String desc = p.getDescription().length() > 200
                        ? p.getDescription().substring(0, 200) + "..."
                        : p.getDescription();
                sb.append("\n    Описание: ").append(desc);
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    private String buildTaskCountContext() {
        long totalTasks = taskRepository.countActiveTasks(null);
        List<Object[]> byStatus = taskRepository.countByStatusAndProjectId(null);
        List<Object[]> byPriority = taskRepository.countByPriorityAndProjectId(null);

        StringBuilder sb = new StringBuilder("СТАТИСТИКА ЗАДАЧ:\n");
        sb.append("  Всего задач: ").append(totalTasks).append("\n");
        sb.append("  По статусам:\n");
        for (Object[] row : byStatus) {
            sb.append("    - ").append(row[0]).append(": ").append(row[1]).append("\n");
        }
        sb.append("  По приоритетам:\n");
        for (Object[] row : byPriority) {
            sb.append("    - ").append(row[0]).append(": ").append(row[1]).append("\n");
        }
        return sb.toString();
    }

    private String buildTaskStatusContext() {
        List<Object[]> byStatus = taskRepository.countByStatusAndProjectId(null);
        List<Object[]> byAssignee = taskRepository.countByAssigneeAndProjectId(null);

        StringBuilder sb = new StringBuilder("ЗАДАЧИ ПО СТАТУСАМ:\n");
        for (Object[] row : byStatus) {
            sb.append("  - ").append(row[0]).append(": ").append(row[1]).append("\n");
        }
        if (!byAssignee.isEmpty()) {
            sb.append("ПО ИСПОЛНИТЕЛЯМ (топ-10):\n");
            int limit = Math.min(byAssignee.size(), 10);
            for (int i = 0; i < limit; i++) {
                sb.append("  - ").append(byAssignee.get(i)[0]).append(": ").append(byAssignee.get(i)[1]).append("\n");
            }
        }
        return sb.toString();
    }

    private String buildOverdueTasksContext() {
        List<com.privod.platform.modules.task.domain.ProjectTask> overdue =
                taskRepository.findOverdueTasks(null, LocalDate.now(),
                        List.of(com.privod.platform.modules.task.domain.TaskStatus.DONE,
                                com.privod.platform.modules.task.domain.TaskStatus.CANCELLED));

        StringBuilder sb = new StringBuilder("ПРОСРОЧЕННЫЕ ЗАДАЧИ: " + overdue.size() + "\n");
        int limit = Math.min(overdue.size(), 20);
        for (int i = 0; i < limit; i++) {
            var task = overdue.get(i);
            sb.append("  - ").append(task.getTitle())
                    .append(" | Срок: ").append(task.getPlannedEndDate())
                    .append(" | Статус: ").append(task.getStatus())
                    .append(" | Приоритет: ").append(task.getPriority());
            if (task.getAssigneeName() != null) {
                sb.append(" | Исполнитель: ").append(task.getAssigneeName());
            }
            sb.append("\n");
        }
        if (overdue.size() > limit) {
            sb.append("  ... и ещё ").append(overdue.size() - limit).append(" просроченных задач\n");
        }
        return sb.toString();
    }

    private String buildContractContext() {
        long contractCount = contractRepository.countActiveContracts(null);
        BigDecimal totalAmount = contractRepository.sumTotalAmount(null);
        List<Object[]> byStatus = contractRepository.countByStatusAndProjectId(null);

        StringBuilder sb = new StringBuilder("КОНТРАКТЫ:\n");
        sb.append("  Всего контрактов: ").append(contractCount).append("\n");
        sb.append("  Общая сумма: ").append(totalAmount != null ? formatMoney(totalAmount) + " руб." : "не указана").append("\n");
        sb.append("  По статусам:\n");
        for (Object[] row : byStatus) {
            sb.append("    - ").append(row[0]).append(": ").append(row[1]).append("\n");
        }
        return sb.toString();
    }

    private String buildEmployeeContext(String userMessage) {
        StringBuilder sb = new StringBuilder("СОТРУДНИКИ:\n");

        // Check if searching for specific employee
        Pattern namePattern = Pattern.compile(
                "(?i)(сотрудник|работник|employee)\\s+([А-Яа-яЁёA-Za-z]{2,30})", Pattern.UNICODE_CASE);
        Matcher matcher = namePattern.matcher(userMessage);

        if (matcher.find()) {
            String searchTerm = matcher.group(2);
            var results = employeeRepository.search(searchTerm, PageRequest.of(0, 5));
            if (results.isEmpty()) {
                sb.append("  Сотрудник по запросу \"").append(searchTerm).append("\" не найден.\n");
            } else {
                sb.append("  Результаты поиска по \"").append(searchTerm).append("\":\n");
                for (var emp : results.getContent()) {
                    sb.append("    - ").append(emp.getFullName())
                            .append(" | Должность: ").append(emp.getPosition() != null ? emp.getPosition() : "не указана")
                            .append(" | Статус: ").append(emp.getStatus())
                            .append("\n");
                }
            }
        } else {
            // General employee stats
            long totalEmployees = employeeRepository.count();
            sb.append("  Всего сотрудников в системе: ").append(totalEmployees).append("\n");
        }
        return sb.toString();
    }

    // ========================================================================
    // Utility
    // ========================================================================

    private String formatMoney(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,.2f", amount);
    }

    private boolean isCommonWord(String word) {
        // Filter out common Russian words that are not project names
        String lower = word.toLowerCase();
        return List.of("все", "мои", "новый", "новые", "последний", "последние",
                "активный", "активные", "текущий", "текущие", "этот", "этого",
                "the", "all", "my", "new", "active", "current", "this"
        ).contains(lower);
    }
}
