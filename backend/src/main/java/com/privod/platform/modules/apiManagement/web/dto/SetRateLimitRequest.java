package com.privod.platform.modules.apiManagement.web.dto;

import jakarta.validation.constraints.Min;

public record SetRateLimitRequest(
        @Min(value = 1, message = "Лимит запросов в минуту должен быть >= 1")
        Integer requestsPerMinute,

        @Min(value = 1, message = "Лимит запросов в час должен быть >= 1")
        Integer requestsPerHour,

        @Min(value = 1, message = "Лимит запросов в день должен быть >= 1")
        Integer requestsPerDay,

        @Min(value = 1, message = "Лимит burst должен быть >= 1")
        Integer burstLimit,

        Boolean isActive
) {
}
