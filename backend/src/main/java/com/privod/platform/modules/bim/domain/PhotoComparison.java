package com.privod.platform.modules.bim.domain;

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

import java.util.UUID;

@Entity
@Table(name = "photo_comparisons", indexes = {
        @Index(name = "idx_photo_comparison_project", columnList = "project_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoComparison extends BaseEntity {

    @Column(name = "before_photo_id", nullable = false)
    private UUID beforePhotoId;

    @Column(name = "after_photo_id", nullable = false)
    private UUID afterPhotoId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
