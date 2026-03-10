package com.privod.platform.modules.constructability.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "constructability_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ConstructabilityItem extends BaseEntity {

    @Column(name = "review_id", nullable = false)
    private UUID reviewId;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private ItemCategory category;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 30)
    @Builder.Default
    private ItemSeverity severity = ItemSeverity.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private ItemStatus status = ItemStatus.OPEN;

    @Column(name = "resolution", columnDefinition = "TEXT")
    private String resolution;

    @Column(name = "rfi_id")
    private UUID rfiId;

    @Column(name = "assigned_to", length = 200)
    private String assignedTo;
}
