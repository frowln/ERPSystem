package com.privod.platform.modules.task.web.dto;

public record UpdateTaskStageRequest(
        String name,
        String color,
        String icon,
        String description,
        Boolean isClosed,
        Integer sequence
) {}
