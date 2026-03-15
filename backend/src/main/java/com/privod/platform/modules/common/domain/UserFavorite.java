package com.privod.platform.modules.common.domain;

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
@Table(name = "user_favorites",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_user_entity_type_id",
                columnNames = {"user_id", "entity_type", "entity_id"}
        ),
        indexes = {
                @Index(name = "idx_user_favorites_user", columnList = "user_id"),
                @Index(name = "idx_user_favorites_entity", columnList = "entity_type, entity_id")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserFavorite extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "entity_name", length = 500)
    private String entityName;
}
