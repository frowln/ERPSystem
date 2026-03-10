package com.privod.platform.modules.notification.domain;

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

import java.util.UUID;

/**
 * Persisted notification event, stored in the notification_events table.
 * Each row represents a discrete real-time event that was dispatched
 * (or is pending dispatch) via WebSocket.
 */
@Entity
@Table(name = "notification_events", indexes = {
        @Index(name = "idx_ne_user_id", columnList = "user_id"),
        @Index(name = "idx_ne_is_read", columnList = "is_read"),
        @Index(name = "idx_ne_user_unread", columnList = "user_id, is_read"),
        @Index(name = "idx_ne_project_id", columnList = "project_id"),
        @Index(name = "idx_ne_entity", columnList = "entity_type, entity_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEventEntity extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "type", nullable = false, length = 50)
    private String type;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "entity_type", length = 100)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean isRead = false;

    /**
     * Mark this event as read.
     */
    public void markRead() {
        this.isRead = true;
    }

    /**
     * Convert from the lightweight record to a persisted entity.
     */
    public static NotificationEventEntity fromEvent(NotificationEvent event) {
        return NotificationEventEntity.builder()
                .userId(event.targetUserId())
                .type(event.type())
                .title(event.title())
                .message(event.message())
                .entityType(event.entityType())
                .entityId(event.entityId())
                .projectId(event.projectId())
                .isRead(false)
                .build();
    }
}
