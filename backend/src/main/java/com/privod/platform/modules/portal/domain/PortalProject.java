package com.privod.platform.modules.portal.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "portal_projects", indexes = {
        @Index(name = "idx_portal_project_user", columnList = "portal_user_id"),
        @Index(name = "idx_portal_project_project", columnList = "project_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PortalProject extends BaseEntity {

    @Column(name = "portal_user_id", nullable = false)
    private UUID portalUserId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_level", nullable = false, length = 20)
    @Builder.Default
    private PortalAccessLevel accessLevel = PortalAccessLevel.VIEW_ONLY;

    @Column(name = "can_view_finance", nullable = false)
    @Builder.Default
    private boolean canViewFinance = false;

    @Column(name = "can_view_documents", nullable = false)
    @Builder.Default
    private boolean canViewDocuments = false;

    @Column(name = "can_view_schedule", nullable = false)
    @Builder.Default
    private boolean canViewSchedule = false;

    @Column(name = "can_view_photos", nullable = false)
    @Builder.Default
    private boolean canViewPhotos = false;

    @Column(name = "granted_by_id")
    private UUID grantedById;

    @Column(name = "granted_at", nullable = false)
    @Builder.Default
    private Instant grantedAt = Instant.now();
}
