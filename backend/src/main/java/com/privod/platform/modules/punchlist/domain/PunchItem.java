package com.privod.platform.modules.punchlist.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "punch_items", indexes = {
        @Index(name = "idx_punch_item_list", columnList = "punch_list_id"),
        @Index(name = "idx_punch_item_status", columnList = "status"),
        @Index(name = "idx_punch_item_priority", columnList = "priority"),
        @Index(name = "idx_punch_item_assigned", columnList = "assigned_to_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PunchItem extends BaseEntity {

    @Column(name = "punch_list_id")
    private UUID punchListId;

    @Column(name = "number", nullable = false)
    private Integer number;

    @Column(name = "description", columnDefinition = "TEXT", nullable = false)
    private String description;

    @Column(name = "location", length = 255)
    private String location;

    @Column(name = "category", length = 50)
    private String category;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private PunchItemPriority priority = PunchItemPriority.MEDIUM;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PunchItemStatus status = PunchItemStatus.OPEN;

    @Column(name = "assigned_to_id")
    private UUID assignedToId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "photo_urls", columnDefinition = "JSONB")
    private String photoUrls;

    @Column(name = "fix_deadline")
    private LocalDate fixDeadline;

    @Column(name = "fixed_at")
    private Instant fixedAt;

    @Column(name = "verified_by_id")
    private UUID verifiedById;

    @Column(name = "verified_at")
    private Instant verifiedAt;
}
