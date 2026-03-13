package com.privod.platform.modules.support.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "ticket_templates", indexes = {
    @Index(name = "idx_ticket_template_org", columnList = "organization_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TicketTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "default_priority", length = 20)
    @Builder.Default
    private String defaultPriority = "MEDIUM";

    @Column(name = "body_template", columnDefinition = "TEXT")
    private String bodyTemplate;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
