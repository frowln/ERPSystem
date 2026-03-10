package com.privod.platform.modules.email.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "email_project_links", indexes = {
        @Index(name = "idx_email_project_links_project", columnList = "project_id"),
        @Index(name = "idx_email_project_links_email", columnList = "email_id")
}, uniqueConstraints = {
        @UniqueConstraint(columnNames = {"email_id", "project_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EmailProjectLink {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "email_id", nullable = false)
    private EmailMessage emailMessage;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "linked_by")
    private UUID linkedBy;

    @Column(name = "linked_at")
    @Builder.Default
    private Instant linkedAt = Instant.now();
}
