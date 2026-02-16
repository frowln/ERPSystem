package com.privod.platform.modules.dailylog.web.dto;

import com.privod.platform.modules.dailylog.domain.EntryType;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.UUID;

public record UpdateDailyLogEntryRequest(
        EntryType entryType,
        String description,
        BigDecimal quantity,

        @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
        String unit,

        LocalTime startTime,
        LocalTime endTime,

        @Size(max = 255, message = "ФИО ответственного не должно превышать 255 символов")
        String responsibleName,

        UUID taskId
) {
}
