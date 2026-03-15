package com.privod.platform.modules.feedback.service;

import com.privod.platform.infrastructure.security.SecurityUtils;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.feedback.domain.FeedbackType;
import com.privod.platform.modules.feedback.domain.UserFeedback;
import com.privod.platform.modules.feedback.repository.UserFeedbackRepository;
import com.privod.platform.modules.feedback.web.dto.FeedbackStatsResponse;
import com.privod.platform.modules.feedback.web.dto.SubmitFeedbackRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final UserFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;

    @Transactional
    public void submitFeedback(SubmitFeedbackRequest request) {
        UUID userId = SecurityUtils.requireCurrentUserId();
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        UserFeedback feedback = UserFeedback.builder()
                .userId(userId)
                .organizationId(orgId)
                .type(request.getType())
                .score(request.getScore())
                .comment(request.getComment())
                .page(request.getPage())
                .createdAt(Instant.now())
                .build();

        feedbackRepository.save(feedback);
    }

    @Transactional(readOnly = true)
    public List<UserFeedback> listFeedback() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();
        return feedbackRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId);
    }

    @Transactional(readOnly = true)
    public boolean shouldShowFeedback() {
        UUID userId = SecurityUtils.requireCurrentUserId();
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        // Day 14 NPS trigger: if user was created 14+ days ago and has never submitted NPS feedback
        boolean day14Trigger = userRepository.findById(userId)
                .map(user -> {
                    boolean createdOver14DaysAgo = user.getCreatedAt() != null
                            && user.getCreatedAt().isBefore(Instant.now().minus(14, ChronoUnit.DAYS));
                    boolean neverSubmittedNps = !feedbackRepository.existsByUserIdAndType(userId, FeedbackType.NPS);
                    return createdOver14DaysAgo && neverSubmittedNps;
                })
                .orElse(false);

        if (day14Trigger) {
            return true;
        }

        // Recurring trigger: show again if last feedback was more than 30 days ago
        return feedbackRepository
                .findTopByUserIdAndOrganizationIdOrderByCreatedAtDesc(userId, orgId)
                .map(latest -> latest.getCreatedAt().isBefore(Instant.now().minus(30, ChronoUnit.DAYS)))
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public FeedbackStatsResponse getStats() {
        UUID orgId = SecurityUtils.requireCurrentOrganizationId();

        List<UserFeedback> npsFeedback = feedbackRepository
                .findByOrganizationIdAndTypeOrderByCreatedAtDesc(orgId, FeedbackType.NPS);

        if (npsFeedback.isEmpty()) {
            return FeedbackStatsResponse.builder()
                    .npsScore(0)
                    .totalResponses(0)
                    .promoters(0)
                    .passives(0)
                    .detractors(0)
                    .build();
        }

        long promoters = npsFeedback.stream().filter(f -> f.getScore() >= 9).count();
        long passives = npsFeedback.stream().filter(f -> f.getScore() >= 7 && f.getScore() <= 8).count();
        long detractors = npsFeedback.stream().filter(f -> f.getScore() <= 6).count();
        long total = npsFeedback.size();

        double npsScore = ((double) (promoters - detractors) / total) * 100;

        return FeedbackStatsResponse.builder()
                .npsScore(Math.round(npsScore * 10.0) / 10.0)
                .totalResponses(total)
                .promoters(promoters)
                .passives(passives)
                .detractors(detractors)
                .build();
    }
}
