package com.privod.platform.modules.planning.web.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

public record WorkVolumeSummaryResponse(
        UUID wbsNodeId,
        String wbsCode,
        String wbsName,
        String nodeType,
        String unitOfMeasure,
        BigDecimal plannedVolume,
        BigDecimal actualVolume,
        BigDecimal remainingVolume,
        BigDecimal percentComplete,
        BigDecimal todayVolume
) {
    public static WorkVolumeSummaryResponse of(
            UUID wbsNodeId, String wbsCode, String wbsName, String nodeType,
            String unitOfMeasure, BigDecimal plannedVolume, BigDecimal actualVolume,
            BigDecimal todayVolume
    ) {
        BigDecimal planned = plannedVolume != null ? plannedVolume : BigDecimal.ZERO;
        BigDecimal actual = actualVolume != null ? actualVolume : BigDecimal.ZERO;
        BigDecimal remaining = planned.subtract(actual).max(BigDecimal.ZERO);
        BigDecimal percent = planned.compareTo(BigDecimal.ZERO) > 0
                ? actual.multiply(BigDecimal.valueOf(100)).divide(planned, 2, RoundingMode.HALF_UP).min(BigDecimal.valueOf(100))
                : BigDecimal.ZERO;
        return new WorkVolumeSummaryResponse(
                wbsNodeId, wbsCode, wbsName, nodeType, unitOfMeasure,
                planned, actual, remaining, percent,
                todayVolume != null ? todayVolume : BigDecimal.ZERO
        );
    }
}
