package com.privod.platform.modules.quality.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "inspection_checklist_items", indexes = {
        @Index(name = "idx_checklist_item_check", columnList = "quality_check_id"),
        @Index(name = "idx_checklist_item_result", columnList = "result")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InspectionChecklistItem extends BaseEntity {

    @NotNull
    @Column(name = "quality_check_id", nullable = false)
    private UUID qualityCheckId;

    @NotBlank
    @Size(max = 500)
    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 20)
    @Builder.Default
    private ChecklistItemResult result = ChecklistItemResult.PENDING;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "photo_urls", columnDefinition = "jsonb")
    @Builder.Default
    private List<String> photoUrls = new ArrayList<>();

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(name = "required", nullable = false)
    @Builder.Default
    private boolean required = true;
}
