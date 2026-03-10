package com.privod.platform.modules.messaging.service;

import com.privod.platform.infrastructure.audit.AuditService;
import com.privod.platform.modules.auth.domain.User;
import com.privod.platform.modules.auth.repository.UserRepository;
import com.privod.platform.modules.messaging.domain.CallParticipant;
import com.privod.platform.modules.messaging.domain.CallParticipantStatus;
import com.privod.platform.modules.messaging.domain.CallSession;
import com.privod.platform.modules.messaging.domain.CallStatus;
import com.privod.platform.modules.messaging.repository.CallParticipantRepository;
import com.privod.platform.modules.messaging.repository.CallSessionRepository;
import com.privod.platform.modules.messaging.web.dto.CallParticipantResponse;
import com.privod.platform.modules.messaging.web.dto.CallSessionResponse;
import com.privod.platform.modules.messaging.web.dto.CreateCallRequest;
import com.privod.platform.modules.messaging.web.dto.EndCallRequest;
import com.privod.platform.modules.messaging.web.dto.JoinCallRequest;
import com.privod.platform.modules.messaging.web.dto.LeaveCallRequest;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class CallSessionService {

    private final CallSessionRepository callSessionRepository;
    private final CallParticipantRepository callParticipantRepository;
    private final AuditService auditService;
    private final SimpMessagingTemplate messagingTemplate;
    private final UserRepository userRepository;

    /**
     * Resolve WebSocket principal name (email) from user UUID.
     * Spring STOMP routes /user/{principal}/queue/... by the authentication principal name,
     * which in our case is the email (set in WebSocketAuthInterceptor from JWT subject).
     */
    private String resolveWsPrincipal(UUID userId) {
        return userRepository.findById(userId)
                .map(User::getEmail)
                .orElse(null);
    }

    private void sendSignalToUser(UUID userId, java.util.Map<String, String> signal) {
        String principal = resolveWsPrincipal(userId);
        if (principal == null) {
            log.warn("Cannot send WS signal to user {}: user not found", userId);
            return;
        }
        messagingTemplate.convertAndSendToUser(principal, "/queue/signal", signal);
        log.debug("Sent {} signal to user {} (principal={})", signal.get("type"), userId, principal);
    }

    @Transactional
    public CallSessionResponse createCall(CreateCallRequest request) {
        CallSession session = CallSession.builder()
                .title(request.title())
                .projectId(request.projectId())
                .channelId(request.channelId())
                .initiatorId(request.initiatorId())
                .initiatorName(request.initiatorName())
                .callType(request.callType())
                .status(CallStatus.RINGING)
                .signalingKey("call-" + UUID.randomUUID())
                .metadataJson(request.metadataJson())
                .build();
        session = callSessionRepository.save(session);

        List<CallParticipant> participants = new ArrayList<>();
        participants.add(CallParticipant.builder()
                .callSessionId(session.getId())
                .userId(request.initiatorId())
                .userName(request.initiatorName())
                .participantStatus(CallParticipantStatus.JOINED)
                .joinedAt(Instant.now())
                .build());

        if (request.inviteeIds() != null) {
            for (UUID inviteeId : request.inviteeIds()) {
                if (inviteeId == null || inviteeId.equals(request.initiatorId())) {
                    continue;
                }
                participants.add(CallParticipant.builder()
                        .callSessionId(session.getId())
                        .userId(inviteeId)
                        .participantStatus(CallParticipantStatus.INVITED)
                        .build());
            }
        }
        callParticipantRepository.saveAll(participants);
        auditService.logCreate("CallSession", session.getId());

        // Send call-invite signal to each invitee via WebSocket
        CallSessionResponse resp = toResponse(session);
        if (request.inviteeIds() != null) {
            for (UUID inviteeId : request.inviteeIds()) {
                if (inviteeId == null || inviteeId.equals(request.initiatorId())) continue;
                try {
                    var signal = java.util.Map.of(
                            "type", "call-invite",
                            "callId", session.getId().toString(),
                            "fromUserId", request.initiatorId().toString(),
                            "toUserId", inviteeId.toString(),
                            "callType", request.callType().name(),
                            "callerName", request.initiatorName() != null ? request.initiatorName() : ""
                    );
                    sendSignalToUser(inviteeId, signal);
                } catch (Exception e) {
                    log.warn("Failed to send call-invite to user {}: {}", inviteeId, e.getMessage());
                }
            }
        }

        log.info("Создан {} звонок {} (sessionId={})", request.callType(), request.title(), session.getId());
        return resp;
    }

    @Transactional(readOnly = true)
    public List<CallSessionResponse> listCalls(UUID projectId, UUID channelId) {
        List<CallSession> sessions;
        if (projectId != null) {
            sessions = callSessionRepository.findTop100ByProjectIdAndDeletedFalseOrderByCreatedAtDesc(projectId);
        } else if (channelId != null) {
            sessions = callSessionRepository.findTop100ByChannelIdAndDeletedFalseOrderByCreatedAtDesc(channelId);
        } else {
            sessions = callSessionRepository.findTop100ByDeletedFalseOrderByCreatedAtDesc();
        }
        return sessions.stream().map(this::toResponse).toList();
    }

    @Transactional
    public CallSessionResponse joinCall(UUID callId, JoinCallRequest request) {
        CallSession session = getSessionOrThrow(callId);
        if (session.getStatus() == CallStatus.ENDED || session.getStatus() == CallStatus.CANCELLED) {
            throw new IllegalStateException("Нельзя присоединиться к завершённому звонку");
        }
        if (session.getStatus() == CallStatus.RINGING) {
            session.setStatus(CallStatus.ACTIVE);
            if (session.getStartedAt() == null) {
                session.setStartedAt(Instant.now());
            }
        }

        CallParticipant participant = callParticipantRepository
                .findByCallSessionIdAndUserIdAndDeletedFalse(callId, request.userId())
                .orElseGet(() -> CallParticipant.builder()
                        .callSessionId(callId)
                        .userId(request.userId())
                        .build());

        participant.setUserName(request.userName());
        participant.setParticipantStatus(CallParticipantStatus.JOINED);
        participant.setJoinedAt(Instant.now());
        participant.setIsMuted(request.muted() != null ? request.muted() : false);
        participant.setIsVideoEnabled(request.videoEnabled() != null ? request.videoEnabled() : true);

        callParticipantRepository.save(participant);
        callSessionRepository.save(session);
        auditService.logUpdate("CallSession", session.getId(), "join", null, request.userId().toString());

        // Notify all other joined participants that someone joined
        CallSessionResponse resp = toResponse(session);
        List<CallParticipant> allParticipants = callParticipantRepository.findByCallSessionIdAndDeletedFalse(callId);
        for (CallParticipant p : allParticipants) {
            if (p.getUserId().equals(request.userId())) continue;
            if (p.getParticipantStatus() != CallParticipantStatus.JOINED) continue;
            try {
                var signal = java.util.Map.of(
                        "type", "call-accept",
                        "callId", callId.toString(),
                        "fromUserId", request.userId().toString(),
                        "toUserId", p.getUserId().toString(),
                        "callType", session.getCallType().name()
                );
                sendSignalToUser(p.getUserId(), signal);
            } catch (Exception e) {
                log.warn("Failed to send call-accept to user {}: {}", p.getUserId(), e.getMessage());
            }
        }

        return resp;
    }

    @Transactional
    public CallSessionResponse leaveCall(UUID callId, LeaveCallRequest request) {
        CallSession session = getSessionOrThrow(callId);
        CallParticipant participant = callParticipantRepository
                .findByCallSessionIdAndUserIdAndDeletedFalse(callId, request.userId())
                .orElseThrow(() -> new EntityNotFoundException("Участник звонка не найден"));

        participant.setParticipantStatus(CallParticipantStatus.LEFT);
        participant.setLeftAt(Instant.now());
        callParticipantRepository.save(participant);

        long joined = callParticipantRepository.countByCallSessionIdAndParticipantStatusAndDeletedFalse(
                callId, CallParticipantStatus.JOINED);
        if (joined == 0 && session.getStatus() != CallStatus.ENDED) {
            finishSession(session, CallStatus.ENDED);
        } else {
            callSessionRepository.save(session);
        }

        auditService.logUpdate("CallSession", session.getId(), "leave", null, request.userId().toString());
        return toResponse(session);
    }

    @Transactional
    public CallSessionResponse endCall(UUID callId, EndCallRequest request) {
        CallSession session = getSessionOrThrow(callId);
        finishSession(session, CallStatus.ENDED);
        auditService.logStatusChange("CallSession", session.getId(), session.getStatus().name(), CallStatus.ENDED.name());
        log.info("Звонок завершён {}, user={}", session.getId(), request.endedByUserId());
        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public List<CallSessionResponse> listActiveCalls() {
        return callSessionRepository.findByStatusAndDeletedFalse(CallStatus.ACTIVE)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CallSessionResponse generateInviteLink(UUID callId) {
        CallSession session = getSessionOrThrow(callId);
        if (session.getInviteToken() == null) {
            session.setInviteToken("inv-" + UUID.randomUUID());
            callSessionRepository.save(session);
        }
        return toResponse(session);
    }

    @Transactional
    public CallSessionResponse joinByInviteToken(String token, String guestName) {
        CallSession session = callSessionRepository.findByInviteTokenAndDeletedFalse(token)
                .orElseThrow(() -> new EntityNotFoundException("Ссылка на звонок недействительна или звонок завершён"));

        if (session.getStatus() == CallStatus.ENDED || session.getStatus() == CallStatus.CANCELLED) {
            throw new IllegalStateException("Звонок уже завершён");
        }

        if (session.getStatus() == CallStatus.RINGING) {
            session.setStatus(CallStatus.ACTIVE);
            if (session.getStartedAt() == null) {
                session.setStartedAt(Instant.now());
            }
        }

        // Create a guest participant with a random UUID (no real user account)
        UUID guestId = UUID.randomUUID();
        CallParticipant participant = CallParticipant.builder()
                .callSessionId(session.getId())
                .userId(guestId)
                .userName(guestName + " (гость)")
                .participantStatus(CallParticipantStatus.JOINED)
                .joinedAt(Instant.now())
                .build();

        callParticipantRepository.save(participant);
        callSessionRepository.save(session);
        log.info("Гость '{}' присоединился к звонку {} по ссылке", guestName, session.getId());
        return toResponse(session);
    }

    @Transactional(readOnly = true)
    public CallSessionResponse getByInviteToken(String token) {
        CallSession session = callSessionRepository.findByInviteTokenAndDeletedFalse(token)
                .orElseThrow(() -> new EntityNotFoundException("Ссылка на звонок недействительна"));
        return toResponse(session);
    }

    private void finishSession(CallSession session, CallStatus targetStatus) {
        if (session.getStartedAt() == null) {
            session.setStartedAt(Instant.now());
        }
        Instant endedAt = Instant.now();
        session.setEndedAt(endedAt);
        session.setStatus(targetStatus);
        long duration = Duration.between(session.getStartedAt(), endedAt).getSeconds();
        session.setDurationSeconds((int) Math.max(0, duration));
        callSessionRepository.save(session);
    }

    private CallSession getSessionOrThrow(UUID id) {
        return callSessionRepository.findByIdAndDeletedFalse(id)
                .orElseThrow(() -> new EntityNotFoundException("Сессия звонка не найдена: " + id));
    }

    private CallSessionResponse toResponse(CallSession session) {
        List<CallParticipantResponse> participants = callParticipantRepository
                .findByCallSessionIdAndDeletedFalse(session.getId())
                .stream()
                .map(CallParticipantResponse::fromEntity)
                .toList();
        return CallSessionResponse.fromEntity(session, participants);
    }
}
