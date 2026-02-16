package com.privod.platform.modules.portal.service;

import com.privod.platform.modules.portal.domain.PortalMessage;
import com.privod.platform.modules.portal.repository.PortalMessageRepository;
import com.privod.platform.modules.portal.web.dto.PortalMessageResponse;
import com.privod.platform.modules.portal.web.dto.SendPortalMessageRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class PortalMessageService {

    private final PortalMessageRepository portalMessageRepository;

    @Transactional
    public PortalMessageResponse send(UUID fromPortalUserId, UUID fromInternalUserId,
                                       SendPortalMessageRequest request) {
        PortalMessage message = PortalMessage.builder()
                .fromPortalUserId(fromPortalUserId)
                .fromInternalUserId(fromInternalUserId)
                .toPortalUserId(request.toPortalUserId())
                .toInternalUserId(request.toInternalUserId())
                .projectId(request.projectId())
                .subject(request.subject())
                .content(request.content())
                .parentMessageId(request.parentMessageId())
                .build();

        message = portalMessageRepository.save(message);
        log.info("Portal message sent: {} -> portal:{}/internal:{}, subject='{}'",
                fromPortalUserId != null ? fromPortalUserId : fromInternalUserId,
                request.toPortalUserId(), request.toInternalUserId(), request.subject());
        return PortalMessageResponse.fromEntity(message);
    }

    @Transactional(readOnly = true)
    public Page<PortalMessageResponse> getInbox(UUID portalUserId, UUID internalUserId, Pageable pageable) {
        return portalMessageRepository.findInbox(portalUserId, internalUserId, pageable)
                .map(PortalMessageResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<PortalMessageResponse> getOutbox(UUID portalUserId, UUID internalUserId, Pageable pageable) {
        return portalMessageRepository.findOutbox(portalUserId, internalUserId, pageable)
                .map(PortalMessageResponse::fromEntity);
    }

    @Transactional
    public PortalMessageResponse markRead(UUID messageId) {
        PortalMessage message = portalMessageRepository.findById(messageId)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сообщение не найдено: " + messageId));

        if (!message.isRead()) {
            message.setRead(true);
            message.setReadAt(Instant.now());
            portalMessageRepository.save(message);
            log.info("Portal message marked as read: {}", messageId);
        }

        return PortalMessageResponse.fromEntity(message);
    }

    @Transactional(readOnly = true)
    public List<PortalMessageResponse> getThread(UUID parentMessageId) {
        PortalMessage parent = portalMessageRepository.findById(parentMessageId)
                .filter(m -> !m.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Сообщение не найдено: " + parentMessageId));

        List<PortalMessageResponse> replies = portalMessageRepository
                .findByParentMessageIdAndDeletedFalseOrderByCreatedAtAsc(parentMessageId)
                .stream()
                .map(PortalMessageResponse::fromEntity)
                .toList();

        List<PortalMessageResponse> thread = new java.util.ArrayList<>();
        thread.add(PortalMessageResponse.fromEntity(parent));
        thread.addAll(replies);
        return thread;
    }
}
