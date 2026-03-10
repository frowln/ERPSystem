package com.privod.platform.modules.bidManagement.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record LevelingMatrixResponse(
        List<BidInvitationResponse> invitations,
        List<String> criteria,
        /** invitationId -> criteriaName -> score details */
        Map<String, Map<String, ScoreCell>> scores,
        /** invitationId -> weighted total */
        Map<String, BigDecimal> totals
) {
    public record ScoreCell(Integer score, Integer maxScore, BigDecimal weight) {}
}
