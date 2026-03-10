package com.privod.platform.modules.support.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTicketTemplateRequest(
    @NotBlank(message = "Название шаблона обязательно")
    String name,
    String description,
    String category,
    String defaultPriority,
    String bodyTemplate
) {}
