package com.privod.platform.modules.quality.domain;

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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "checklist_execution_items", indexes = {
        @Index(name = "idx_cei_checklist", columnList = "checklist_id"),
        @Index(name = "idx_cei_result", columnList = "result")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistExecutionItem extends BaseEntity {

    @Column(name = "checklist_id", nullable = false)
    private UUID checklistId;

    @Column(name = "description", nullable = false, length = 1000)
    private String description;

    @Column(name = "category", length = 255)
    private String category;

    @Column(name = "is_required", nullable = false)
    @Builder.Default
    private boolean required = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 20)
    @Builder.Default
    private ChecklistItemResult result = ChecklistItemResult.PENDING;

    @Column(name = "photo_required", nullable = false)
    @Builder.Default
    private boolean photoRequired = false;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "photo_urls", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> photoUrls = new ArrayList<>();

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "inspector_id")
    private UUID inspectorId;

    @Column(name = "inspector_name", length = 255)
    private String inspectorName;

    @Column(name = "inspected_at")
    private Instant inspectedAt;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;
}
