package com.privod.platform.modules.chatter.service;

import com.privod.platform.modules.chatter.domain.Follower;
import com.privod.platform.modules.chatter.repository.FollowerRepository;
import com.privod.platform.modules.chatter.web.dto.AddFollowerRequest;
import com.privod.platform.modules.chatter.web.dto.FollowerResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FollowerService {

    private final FollowerRepository followerRepository;

    @Transactional
    public FollowerResponse follow(AddFollowerRequest request) {
        var existing = followerRepository.findByEntityTypeAndEntityIdAndUserId(
                request.entityType(), request.entityId(), request.userId());

        if (existing.isPresent()) {
            Follower follower = existing.get();
            follower.setActive(true);
            follower.setFollowReason(request.followReason());
            follower = followerRepository.save(follower);
            log.info("User {} re-followed {} {}", request.userId(), request.entityType(), request.entityId());
            return FollowerResponse.fromEntity(follower);
        }

        Follower follower = Follower.builder()
                .entityType(request.entityType())
                .entityId(request.entityId())
                .userId(request.userId())
                .followReason(request.followReason())
                .isActive(true)
                .build();

        follower = followerRepository.save(follower);
        log.info("User {} followed {} {}", request.userId(), request.entityType(), request.entityId());
        return FollowerResponse.fromEntity(follower);
    }

    @Transactional
    public void unfollow(String entityType, UUID entityId, UUID userId) {
        followerRepository.findByEntityTypeAndEntityIdAndUserId(entityType, entityId, userId)
                .ifPresent(follower -> {
                    follower.setActive(false);
                    followerRepository.save(follower);
                    log.info("User {} unfollowed {} {}", userId, entityType, entityId);
                });
    }

    @Transactional(readOnly = true)
    public List<FollowerResponse> getFollowers(String entityType, UUID entityId) {
        return followerRepository.findByEntityTypeAndEntityIdAndIsActiveTrue(entityType, entityId)
                .stream()
                .map(FollowerResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isFollowing(String entityType, UUID entityId, UUID userId) {
        return followerRepository.existsByEntityTypeAndEntityIdAndUserIdAndIsActiveTrue(
                entityType, entityId, userId);
    }
}
