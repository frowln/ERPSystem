package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.UUID;

public record CreateTimeEntryRequest(
    UUID userId,
    String userName,
    @NotNull(message = "Время начала обязательно")
    Instant startedAt,
    @NotNull(message = "Время окончания обязательно")
    Instant stoppedAt,
    String description
) {}
