package com.privod.platform.modules.feedback.repository;

import com.privod.platform.modules.feedback.domain.FeedbackType;
import com.privod.platform.modules.feedback.domain.UserFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserFeedbackRepository extends JpaRepository<UserFeedback, UUID> {

    Optional<UserFeedback> findTopByUserIdAndOrganizationIdOrderByCreatedAtDesc(UUID userId, UUID orgId);

    List<UserFeedback> findByOrganizationIdOrderByCreatedAtDesc(UUID orgId);

    List<UserFeedback> findByOrganizationIdAndTypeOrderByCreatedAtDesc(UUID orgId, FeedbackType type);
}
