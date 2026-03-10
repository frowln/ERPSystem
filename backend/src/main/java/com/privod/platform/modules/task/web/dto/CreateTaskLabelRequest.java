package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateTaskLabelRequest(
    @NotBlank(message = "Название метки обязательно")
    @Size(max = 100)
    String name,
    @NotBlank(message = "Цвет обязателен")
    String color,
    String icon
) {}
