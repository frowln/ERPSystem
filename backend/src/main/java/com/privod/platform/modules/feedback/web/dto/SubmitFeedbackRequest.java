package com.privod.platform.modules.feedback.web.dto;

import com.privod.platform.modules.feedback.domain.FeedbackType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SubmitFeedbackRequest {

    @NotNull
    private FeedbackType type;

    @NotNull
    @Min(0)
    @Max(10)
    private Integer score;

    private String comment;

    private String page;
}
