package com.privod.platform.modules.task.web.dto;

import java.util.List;

public record MyTasksResponse(
    List<TaskResponse> assigned,
    List<TaskResponse> delegatedByMe,
    List<TaskResponse> favorites
) {}
