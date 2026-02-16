package com.privod.platform.modules.chatter.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "chatter_followers", indexes = {
        @Index(name = "idx_follower_entity", columnList = "entity_type, entity_id"),
        @Index(name = "idx_follower_user", columnList = "user_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_follower_entity_user",
                columnNames = {"entity_type", "entity_id", "user_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Follower extends BaseEntity {

    @Column(name = "entity_type", nullable = false, length = 100)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "follow_reason", length = 255)
    private String followReason;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
