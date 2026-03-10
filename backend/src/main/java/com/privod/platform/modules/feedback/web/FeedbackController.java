package com.privod.platform.modules.feedback.web;

import com.privod.platform.infrastructure.web.ApiResponse;
import com.privod.platform.modules.feedback.domain.UserFeedback;
import com.privod.platform.modules.feedback.service.FeedbackService;
import com.privod.platform.modules.feedback.web.dto.FeedbackStatsResponse;
import com.privod.platform.modules.feedback.web.dto.SubmitFeedbackRequest;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
@Tag(name = "Feedback", description = "NPS/CSAT feedback endpoints")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all feedback for the organization (ADMIN only)")
    public ResponseEntity<ApiResponse<List<UserFeedback>>> list() {
        List<UserFeedback> feedback = feedbackService.listFeedback();
        return ResponseEntity.ok(ApiResponse.ok(feedback));
    }

    @PostMapping
    @Operation(summary = "Submit NPS/CSAT feedback")
    public ResponseEntity<ApiResponse<Void>> submit(
            @Valid @RequestBody SubmitFeedbackRequest request) {
        feedbackService.submitFeedback(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok());
    }

    @GetMapping("/should-show")
    @Operation(summary = "Check if feedback widget should be displayed")
    public ResponseEntity<ApiResponse<Boolean>> shouldShow() {
        boolean result = feedbackService.shouldShowFeedback();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get NPS stats for organization (ADMIN only)")
    public ResponseEntity<ApiResponse<FeedbackStatsResponse>> getStats() {
        FeedbackStatsResponse stats = feedbackService.getStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }
}
