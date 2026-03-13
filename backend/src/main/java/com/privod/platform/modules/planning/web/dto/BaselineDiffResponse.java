package com.privod.platform.modules.planning.web.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * P2-PRJ-2: Response for baseline vs. current schedule comparison.
 * Each NodeDiff represents a WBS node and its deviation from the saved baseline.
 */
public record BaselineDiffResponse(
        UUID baselineId,
        UUID projectId,
        String baselineName,
        LocalDate baselineDate,
        List<NodeDiff> diffs,
        long slippedCount,
        long addedCount,
        long removedCount
) {

    public record NodeDiff(
            UUID nodeId,
            String code,
            String name,
            LocalDate baselineStart,
            LocalDate baselineEnd,
            LocalDate currentStart,
            LocalDate currentEnd,
            /** Positive = later than baseline (slip), Negative = earlier */
            long startSlipDays,
            long endSlipDays,
            /** ADDED | REMOVED | CHANGED | UNCHANGED */
            String changeType
    ) {
        public static NodeDiff of(UUID nodeId, String code, String name,
                                  LocalDate baselineStart, LocalDate baselineEnd,
                                  LocalDate currentStart, LocalDate currentEnd,
                                  long startSlipDays, long endSlipDays, boolean changed) {
            String type = changed ? "CHANGED" : "UNCHANGED";
            return new NodeDiff(nodeId, code, name, baselineStart, baselineEnd,
                    currentStart, currentEnd, startSlipDays, endSlipDays, type);
        }

        public static NodeDiff added(UUID nodeId, String code, String name,
                                     LocalDate currentStart, LocalDate currentEnd) {
            return new NodeDiff(nodeId, code, name, null, null, currentStart, currentEnd, 0, 0, "ADDED");
        }

        public static NodeDiff removed(String code, String name) {
            return new NodeDiff(null, code, name, null, null, null, null, 0, 0, "REMOVED");
        }
    }
}
