package com.privod.platform.modules.regulatory.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record PrescriptionDashboardResponse(
        long totalActive,
        long totalOverdue,
        long totalCompleted,
        BigDecimal totalFines,
        Map<String, Long> byStatus,
        List<BodyTypeCount> byBodyType,
        List<PrescriptionResponse> approachingDeadline,
        List<PrescriptionResponse> overdue
) {
    public record BodyTypeCount(String bodyType, String displayName, long count) {}
}
