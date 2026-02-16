package com.privod.platform.modules.messaging.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "channel_members",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_channel_member", columnNames = {"channel_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_channel_member_channel", columnList = "channel_id"),
                @Index(name = "idx_channel_member_user", columnList = "user_id"),
                @Index(name = "idx_channel_member_role", columnList = "channel_id, role")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChannelMember extends BaseEntity {

    @Column(name = "channel_id", nullable = false)
    private UUID channelId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_name", length = 255)
    private String userName;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    @Builder.Default
    private ChannelMemberRole role = ChannelMemberRole.MEMBER;

    @Column(name = "is_muted", nullable = false)
    @Builder.Default
    private Boolean isMuted = false;

    @Column(name = "last_read_at")
    private Instant lastReadAt;

    @Column(name = "unread_count", nullable = false)
    @Builder.Default
    private Integer unreadCount = 0;

    @Column(name = "joined_at", nullable = false)
    @Builder.Default
    private Instant joinedAt = Instant.now();
}
