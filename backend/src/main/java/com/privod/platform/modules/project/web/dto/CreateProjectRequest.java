package com.privod.platform.modules.project.web.dto;

import com.privod.platform.modules.project.domain.ProjectPriority;
import com.privod.platform.modules.project.domain.ProjectType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateProjectRequest(
        @NotBlank(message = "Project name is required")
        @Size(max = 500, message = "Name must not exceed 500 characters")
        String name,

        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description,

        UUID organizationId,

        UUID customerId,

        UUID managerId,

        LocalDate plannedStartDate,

        LocalDate plannedEndDate,

        @Size(max = 1000)
        String address,

        @Size(max = 100)
        String city,

        @Size(max = 100)
        String region,

        BigDecimal latitude,

        BigDecimal longitude,

        @Positive(message = "Budget amount must be positive")
        BigDecimal budgetAmount,

        @Positive(message = "Contract amount must be positive")
        BigDecimal contractAmount,

        ProjectType type,

        @Size(max = 100)
        String category,

        @Size(max = 50)
        String constructionKind,

        ProjectPriority priority
) {
}
