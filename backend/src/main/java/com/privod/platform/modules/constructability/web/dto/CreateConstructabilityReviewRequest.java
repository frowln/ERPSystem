package com.privod.platform.modules.constructability.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateConstructabilityReviewRequest(
    @NotNull UUID projectId,
    UUID specificationId,
    @NotBlank String title,
    @NotBlank String reviewerName,
    @NotNull LocalDate reviewDate,
    String overallRating,
    String notes
) {}
