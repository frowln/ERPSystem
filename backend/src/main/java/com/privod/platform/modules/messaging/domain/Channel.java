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
@Table(name = "channels", indexes = {
        @Index(name = "idx_channel_code", columnList = "code", unique = true),
        @Index(name = "idx_channel_type", columnList = "channel_type"),
        @Index(name = "idx_channel_creator", columnList = "creator_id"),
        @Index(name = "idx_channel_project", columnList = "project_id"),
        @Index(name = "idx_channel_archived", columnList = "is_archived"),
        @Index(name = "idx_channel_last_message", columnList = "last_message_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Channel extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "code", nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel_type", nullable = false, length = 20)
    @Builder.Default
    private ChannelType channelType = ChannelType.PUBLIC;

    @Column(name = "avatar_url", length = 1000)
    private String avatarUrl;

    @Column(name = "creator_id", nullable = false)
    private UUID creatorId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "member_count", nullable = false)
    @Builder.Default
    private Integer memberCount = 0;

    @Column(name = "last_message_at")
    private Instant lastMessageAt;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private Boolean isArchived = false;

    public void incrementMemberCount() {
        this.memberCount = (this.memberCount != null ? this.memberCount : 0) + 1;
    }

    public void decrementMemberCount() {
        this.memberCount = Math.max(0, (this.memberCount != null ? this.memberCount : 0) - 1);
    }
}
