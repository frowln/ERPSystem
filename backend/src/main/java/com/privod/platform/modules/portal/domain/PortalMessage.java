package com.privod.platform.modules.portal.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "portal_messages", indexes = {
        @Index(name = "idx_portal_msg_from_portal", columnList = "from_portal_user_id"),
        @Index(name = "idx_portal_msg_to_portal", columnList = "to_portal_user_id"),
        @Index(name = "idx_portal_msg_from_internal", columnList = "from_internal_user_id"),
        @Index(name = "idx_portal_msg_to_internal", columnList = "to_internal_user_id"),
        @Index(name = "idx_portal_msg_project", columnList = "project_id"),
        @Index(name = "idx_portal_msg_parent", columnList = "parent_message_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortalMessage extends BaseEntity {

    @Column(name = "from_portal_user_id")
    private UUID fromPortalUserId;

    @Column(name = "to_portal_user_id")
    private UUID toPortalUserId;

    @Column(name = "from_internal_user_id")
    private UUID fromInternalUserId;

    @Column(name = "to_internal_user_id")
    private UUID toInternalUserId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "subject", nullable = false, length = 500)
    private String subject;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @Column(name = "read_at")
    private Instant readAt;

    @Column(name = "parent_message_id")
    private UUID parentMessageId;
}
