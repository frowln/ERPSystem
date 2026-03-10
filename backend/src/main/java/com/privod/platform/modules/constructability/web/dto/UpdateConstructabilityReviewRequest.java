package com.privod.platform.modules.constructability.web.dto;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateConstructabilityReviewRequest(
    UUID specificationId,
    String title,
    String reviewerName,
    LocalDate reviewDate,
    String overallRating,
    String status,
    String notes
) {}
