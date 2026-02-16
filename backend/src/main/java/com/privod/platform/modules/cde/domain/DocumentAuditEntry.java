package com.privod.platform.modules.cde.domain;

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
@Table(name = "cde_document_audit_entries", indexes = {
        @Index(name = "idx_cde_audit_container", columnList = "document_container_id"),
        @Index(name = "idx_cde_audit_action", columnList = "action"),
        @Index(name = "idx_cde_audit_performed_at", columnList = "performed_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAuditEntry extends BaseEntity {

    @Column(name = "document_container_id", nullable = false)
    private UUID documentContainerId;

    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Column(name = "performed_by_id")
    private UUID performedById;

    @Column(name = "performed_at", nullable = false)
    private Instant performedAt;

    @Column(name = "previous_state", length = 30)
    private String previousState;

    @Column(name = "new_state", length = 30)
    private String newState;

    @Column(name = "details", columnDefinition = "JSONB")
    private String details;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;
}
