package com.privod.platform.modules.messaging.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "call_participants", indexes = {
        @Index(name = "idx_call_participant_call", columnList = "call_session_id"),
        @Index(name = "idx_call_participant_user", columnList = "user_id"),
        @Index(name = "idx_call_participant_status", columnList = "participant_status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallParticipant extends BaseEntity {

    @Column(name = "call_session_id", nullable = false)
    private UUID callSessionId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_name", length = 255)
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(name = "participant_status", nullable = false, length = 20)
    @Builder.Default
    private CallParticipantStatus participantStatus = CallParticipantStatus.INVITED;

    @Column(name = "joined_at")
    private Instant joinedAt;

    @Column(name = "left_at")
    private Instant leftAt;

    @Column(name = "is_muted", nullable = false)
    @Builder.Default
    private Boolean isMuted = false;

    @Column(name = "is_video_enabled", nullable = false)
    @Builder.Default
    private Boolean isVideoEnabled = true;
}
