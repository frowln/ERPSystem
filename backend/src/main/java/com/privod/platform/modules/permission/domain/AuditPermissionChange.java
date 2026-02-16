package com.privod.platform.modules.permission.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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
@Table(name = "permission_audit_log", indexes = {
        @Index(name = "idx_pal_user", columnList = "user_id"),
        @Index(name = "idx_pal_target", columnList = "target_user_id"),
        @Index(name = "idx_pal_group", columnList = "group_id"),
        @Index(name = "idx_pal_action", columnList = "action"),
        @Index(name = "idx_pal_created", columnList = "created_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditPermissionChange {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private PermissionAuditAction action;

    @Column(name = "target_user_id")
    private UUID targetUserId;

    @Column(name = "group_id")
    private UUID groupId;

    @Column(name = "details", columnDefinition = "JSONB")
    private String details;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
