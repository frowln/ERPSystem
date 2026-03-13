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
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "call_sessions", indexes = {
        @Index(name = "idx_call_project", columnList = "project_id"),
        @Index(name = "idx_call_channel", columnList = "channel_id"),
        @Index(name = "idx_call_status", columnList = "status"),
        @Index(name = "idx_call_started_at", columnList = "started_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CallSession extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "title", length = 500)
    private String title;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "channel_id")
    private UUID channelId;

    @Column(name = "initiator_id", nullable = false)
    private UUID initiatorId;

    @Column(name = "initiator_name", length = 255)
    private String initiatorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "call_type", nullable = false, length = 20)
    private CallType callType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private CallStatus status = CallStatus.RINGING;

    @Column(name = "signaling_key", nullable = false, unique = true, length = 128)
    private String signalingKey;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "duration_seconds", nullable = false)
    @Builder.Default
    private Integer durationSeconds = 0;

    @Column(name = "metadata_json", columnDefinition = "TEXT")
    private String metadataJson;

    @Column(name = "invite_token", unique = true, length = 128)
    private String inviteToken;
}
