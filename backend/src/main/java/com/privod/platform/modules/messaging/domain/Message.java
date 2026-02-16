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
@Table(name = "messages", indexes = {
        @Index(name = "idx_message_channel", columnList = "channel_id"),
        @Index(name = "idx_message_author", columnList = "author_id"),
        @Index(name = "idx_message_parent", columnList = "parent_message_id"),
        @Index(name = "idx_message_channel_created", columnList = "channel_id, created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Message extends BaseEntity {

    @Column(name = "channel_id", nullable = false)
    private UUID channelId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "author_name", length = 255)
    private String authorName;

    @Column(name = "author_avatar_url", length = 1000)
    private String authorAvatarUrl;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false, length = 20)
    @Builder.Default
    private MessageType messageType = MessageType.TEXT;

    @Column(name = "parent_message_id")
    private UUID parentMessageId;

    @Column(name = "is_edited", nullable = false)
    @Builder.Default
    private Boolean isEdited = false;

    @Column(name = "edited_at")
    private Instant editedAt;

    @Column(name = "is_pinned", nullable = false)
    @Builder.Default
    private Boolean isPinned = false;

    @Column(name = "pinned_by")
    private UUID pinnedBy;

    @Column(name = "pinned_at")
    private Instant pinnedAt;

    @Column(name = "reply_count", nullable = false)
    @Builder.Default
    private Integer replyCount = 0;

    @Column(name = "reaction_count", nullable = false)
    @Builder.Default
    private Integer reactionCount = 0;

    @Column(name = "attachment_url", length = 1000)
    private String attachmentUrl;

    @Column(name = "attachment_name", length = 500)
    private String attachmentName;

    @Column(name = "attachment_size")
    private Long attachmentSize;

    @Column(name = "attachment_type", length = 100)
    private String attachmentType;

    public void incrementReplyCount() {
        this.replyCount = (this.replyCount != null ? this.replyCount : 0) + 1;
    }

    public void incrementReactionCount() {
        this.reactionCount = (this.reactionCount != null ? this.reactionCount : 0) + 1;
    }

    public void decrementReactionCount() {
        this.reactionCount = Math.max(0, (this.reactionCount != null ? this.reactionCount : 0) - 1);
    }
}
