package com.privod.platform.modules.feedback.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FeedbackStatsResponse {

    private final double npsScore;
    private final long totalResponses;
    private final long promoters;
    private final long passives;
    private final long detractors;
}
