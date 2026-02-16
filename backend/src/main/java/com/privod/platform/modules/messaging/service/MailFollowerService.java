package com.privod.platform.modules.messaging.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.infrastructure.security.CustomUserDetails;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.messaging.domain.MailFollower;
import com.privod.platform.modules.messaging.repository.MailFollowerRepository;
import com.privod.platform.modules.messaging.web.dto.FollowRecordRequest;
import com.privod.platform.modules.messaging.web.dto.MailFollowerResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MailFollowerService {

    private final MailFollowerRepository mailFollowerRepository;
    private final UserRepository userRepository;
    private final AuditService auditService;

    @Transactional
    public MailFollowerResponse followRecord(FollowRecordRequest request) {
        User current = getCurrentUserEntity();

        if (mailFollowerRepository.existsByModelNameAndRecordIdAndUserId(
                request.modelName(), request.recordId(), current.getId())) {
            MailFollower existing = mailFollowerRepository
                    .findByModelNameAndRecordIdAndUserId(request.modelName(), request.recordId(), current.getId())
                    .orElseThrow();
            existing.setSubtypeIds(request.subtypeIds());
            existing.setChannelId(request.channelId());
            existing = mailFollowerRepository.save(existing);
            return MailFollowerResponse.fromEntity(existing);
        }

        MailFollower follower = MailFollower.builder()
                .modelName(request.modelName())
                .recordId(request.recordId())
                .userId(current.getId())
                .channelId(request.channelId())
                .subtypeIds(request.subtypeIds())
                .build();
        follower = mailFollowerRepository.save(follower);
        auditService.logCreate("MailFollower", follower.getId());
        return MailFollowerResponse.fromEntity(follower);
    }

    @Transactional
    public MailFollowerResponse addFollower(String modelName, UUID recordId, UUID userId, String subtypeIds) {
        if (mailFollowerRepository.existsByModelNameAndRecordIdAndUserId(modelName, recordId, userId)) {
            MailFollower existing = mailFollowerRepository
                    .findByModelNameAndRecordIdAndUserId(modelName, recordId, userId)
                    .orElseThrow();
            return MailFollowerResponse.fromEntity(existing);
        }

        MailFollower follower = MailFollower.builder()
                .modelName(modelName)
                .recordId(recordId)
                .userId(userId)
                .subtypeIds(subtypeIds)
                .build();
        follower = mailFollowerRepository.save(follower);
        auditService.logCreate("MailFollower", follower.getId());
        return MailFollowerResponse.fromEntity(follower);
    }

    @Transactional
    public void unfollowRecord(String modelName, UUID recordId) {
        User current = getCurrentUserEntity();
        MailFollower follower = mailFollowerRepository
                .findByModelNameAndRecordIdAndUserId(modelName, recordId, current.getId())
                .orElseThrow(() -> new EntityNotFoundException("Подписка не найдена"));
        follower.softDelete();
        mailFollowerRepository.save(follower);
        auditService.logDelete("MailFollower", follower.getId());
    }

    @Transactional
    public void removeFollower(String modelName, UUID recordId, UUID userId) {
        MailFollower follower = mailFollowerRepository
                .findByModelNameAndRecordIdAndUserId(modelName, recordId, userId)
                .orElseThrow(() -> new EntityNotFoundException("Подписка не найдена"));
        follower.softDelete();
        mailFollowerRepository.save(follower);
        auditService.logDelete("MailFollower", follower.getId());
    }

    @Transactional(readOnly = true)
    public List<MailFollowerResponse> getFollowers(String modelName, UUID recordId) {
        return mailFollowerRepository.findByModelNameAndRecordId(modelName, recordId)
                .stream()
                .map(MailFollowerResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MailFollowerResponse> getMyFollowedRecords() {
        User current = getCurrentUserEntity();
        return mailFollowerRepository.findByUserId(current.getId())
                .stream()
                .map(MailFollowerResponse::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public boolean isFollowing(String modelName, UUID recordId) {
        User current = getCurrentUserEntity();
        return mailFollowerRepository.existsByModelNameAndRecordIdAndUserId(
                modelName, recordId, current.getId());
    }

    @Transactional(readOnly = true)
    public long getFollowerCount(String modelName, UUID recordId) {
        return mailFollowerRepository.countByModelNameAndRecordId(modelName, recordId);
    }

    private User getCurrentUserEntity() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("Пользователь не аутентифицирован");
        }
        String email;
        if (authentication.getPrincipal() instanceof CustomUserDetails customUserDetails) {
            email = customUserDetails.getEmail();
        } else {
            email = authentication.getName();
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден: " + email));
    }
}
