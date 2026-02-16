package com.privod.platform.modules.project.domain;

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

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "project_collaborators", indexes = {
        @Index(name = "idx_project_collab_project", columnList = "project_id"),
        @Index(name = "idx_project_collab_partner", columnList = "partner_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectCollaborator extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "partner_id", nullable = false)
    private UUID partnerId;

    @Column(name = "role", length = 100)
    private String role;

    @Column(name = "invited_at")
    private LocalDateTime invitedAt;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;

    public boolean isAccepted() {
        return acceptedAt != null;
    }
}
