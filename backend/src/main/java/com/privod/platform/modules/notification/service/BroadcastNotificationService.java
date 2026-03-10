package com.privod.platform.modules.notification.service;

import com.privod.platform.modules.notification.domain.BroadcastNotification;
import com.privod.platform.modules.notification.domain.BroadcastPriority;
import com.privod.platform.modules.notification.repository.BroadcastNotificationRepository;
import com.privod.platform.modules.notification.web.dto.BroadcastResponse;
import com.privod.platform.modules.notification.web.dto.CreateBroadcastRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class BroadcastNotificationService {

    private final BroadcastNotificationRepository broadcastNotificationRepository;

    @Transactional(readOnly = true)
    public List<BroadcastResponse> getActiveBroadcasts(UUID organizationId) {
        return broadcastNotificationRepository
                .findByOrganizationIdAndActiveTrueAndDeletedFalseOrderByCreatedAtDesc(organizationId)
                .stream()
                .map(BroadcastResponse::fromEntity)
                .toList();
    }

    @Transactional
    public BroadcastResponse create(CreateBroadcastRequest request, UUID organizationId, UUID userId) {
        BroadcastNotification broadcast = BroadcastNotification.builder()
                .organizationId(organizationId)
                .title(request.title())
                .message(request.message())
                .type(request.type())
                .priority(request.priority() != null ? request.priority() : BroadcastPriority.NORMAL)
                .broadcastCreatedBy(userId)
                .expiresAt(request.expiresAt())
                .active(true)
                .build();

        broadcast = broadcastNotificationRepository.save(broadcast);
        log.info("Broadcast notification created: {} by user {} in org {}", broadcast.getId(), userId, organizationId);

        return BroadcastResponse.fromEntity(broadcast);
    }

    @Transactional
    public void deactivate(UUID broadcastId, UUID organizationId) {
        BroadcastNotification broadcast = broadcastNotificationRepository.findById(broadcastId)
                .filter(b -> !b.isDeleted() && b.getOrganizationId().equals(organizationId))
                .orElseThrow(() -> new EntityNotFoundException("Объявление не найдено: " + broadcastId));

        broadcast.deactivate();
        broadcastNotificationRepository.save(broadcast);
        log.info("Broadcast notification deactivated: {} in org {}", broadcastId, organizationId);
    }
}
