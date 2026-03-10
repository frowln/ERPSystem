package com.privod.platform.modules.task.domain;

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
@Table(name = "task_comment_reactions",
        uniqueConstraints = {
                @UniqueConstraint(name = "uq_task_comment_reaction", columnNames = {"comment_id", "user_id", "emoji"})
        },
        indexes = {
                @Index(name = "idx_task_comment_reactions_comment", columnList = "comment_id")
        })
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaskCommentReaction extends BaseEntity {

    @Column(name = "comment_id", nullable = false)
    private UUID commentId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "user_name", length = 255)
    private String userName;

    @Column(name = "emoji", nullable = false, length = 50)
    private String emoji;
}
