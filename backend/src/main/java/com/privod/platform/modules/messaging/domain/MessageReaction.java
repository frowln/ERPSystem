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

import java.util.UUID;

@Entity
@Table(name = "message_reactions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_message_reaction", columnNames = {"message_id", "user_id", "emoji"})
        },
        indexes = {
                @Index(name = "idx_reaction_message", columnList = "message_id"),
                @Index(name = "idx_reaction_user", columnList = "user_id")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageReaction extends BaseEntity {

    @Column(name = "message_id", nullable = false)
    private UUID messageId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_name", length = 255)
    private String userName;

    @Column(name = "emoji", nullable = false, length = 50)
    private String emoji;
}
