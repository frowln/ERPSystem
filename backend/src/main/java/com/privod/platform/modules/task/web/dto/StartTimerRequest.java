package com.privod.platform.modules.task.web.dto;

import java.util.UUID;

public record StartTimerRequest(
    UUID userId,
    String userName
) {}
