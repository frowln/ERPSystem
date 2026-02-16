package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.NumberSequence;
import com.privod.platform.modules.settings.domain.ResetPeriod;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record NumberSequenceResponse(
        UUID id,
        String code,
        String name,
        String prefix,
        String suffix,
        Long nextNumber,
        Integer step,
        Integer padding,
        ResetPeriod resetPeriod,
        String resetPeriodDisplayName,
        LocalDate lastResetDate,
        String preview,
        Instant createdAt,
        Instant updatedAt
) {
    public static NumberSequenceResponse fromEntity(NumberSequence seq) {
        return new NumberSequenceResponse(
                seq.getId(),
                seq.getCode(),
                seq.getName(),
                seq.getPrefix(),
                seq.getSuffix(),
                seq.getNextNumber(),
                seq.getStep(),
                seq.getPadding(),
                seq.getResetPeriod(),
                seq.getResetPeriod().getDisplayName(),
                seq.getLastResetDate(),
                seq.formatCurrentNumber(),
                seq.getCreatedAt(),
                seq.getUpdatedAt()
        );
    }
}
