package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record OrgDashboardResponse(
        int activeProjects,
        BigDecimal totalBudget,
        BigDecimal totalSpent,
        double budgetUtilization,
        int activeTasks,
        int overdueTasks,
        int openDefects,
        double safetyScore,
        List<MilestoneEntry> upcomingMilestones,
        List<ActivityEntry> recentActivities
) {
    public record MilestoneEntry(
            String projectName,
            String milestoneName,
            LocalDate dueDate,
            String status
    ) {}

    public record ActivityEntry(
            String type,
            String description,
            String projectName,
            String timestamp
    ) {}
}
