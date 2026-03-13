package com.privod.platform.modules.task.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "task_labels", indexes = {
    @Index(name = "idx_task_label_org", columnList = "organization_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TaskLabel {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "color", nullable = false, length = 20)
    private String color;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "created_at")
    @Builder.Default
    private Instant createdAt = Instant.now();
}
