package com.privod.platform.modules.integration.telegram.domain;

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

@Entity
@Table(name = "telegram_subscriptions", indexes = {
        @Index(name = "idx_tg_sub_user", columnList = "user_id"),
        @Index(name = "idx_tg_sub_chat", columnList = "chat_id"),
        @Index(name = "idx_tg_sub_active", columnList = "active"),
        @Index(name = "idx_tg_sub_user_chat", columnList = "user_id, chat_id", unique = true)
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TelegramSubscription extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "chat_id", nullable = false, length = 100)
    private String chatId;

    @Column(name = "notify_projects", nullable = false)
    @Builder.Default
    private boolean notifyProjects = true;

    @Column(name = "notify_safety", nullable = false)
    @Builder.Default
    private boolean notifySafety = true;

    @Column(name = "notify_tasks", nullable = false)
    @Builder.Default
    private boolean notifyTasks = true;

    @Column(name = "notify_approvals", nullable = false)
    @Builder.Default
    private boolean notifyApprovals = true;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
