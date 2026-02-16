package com.privod.platform.modules.chatter.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "chatter_comments", indexes = {
        @Index(name = "idx_comment_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_comment_author", columnList = "author_id"),
        @Index(name = "idx_comment_parent", columnList = "parent_comment_id"),
        @Index(name = "idx_comment_created_at", columnList = "created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Comment extends BaseEntity {

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "author_id", nullable = false)
    private UUID authorId;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "attachment_urls", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> attachmentUrls = List.of();

    @Column(name = "parent_comment_id")
    private UUID parentCommentId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "mentioned_user_ids", columnDefinition = "jsonb")
    @Builder.Default
    private List<UUID> mentionedUserIds = List.of();

    @Column(name = "is_internal", nullable = false)
    @Builder.Default
    private boolean isInternal = false;
}
