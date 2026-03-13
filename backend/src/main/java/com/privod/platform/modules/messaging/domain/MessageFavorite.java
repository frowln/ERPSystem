package com.privod.platform.modules.messaging.domain;

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
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "message_favorites",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_message_favorite", columnNames = {"message_id", "user_id"})
        },
        indexes = {
                @Index(name = "idx_favorite_message", columnList = "message_id"),
                @Index(name = "idx_favorite_user", columnList = "user_id")
        })
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageFavorite extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;
}
