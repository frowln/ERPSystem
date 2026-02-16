package com.privod.platform.modules.bim.domain;

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

import java.util.UUID;

@Entity
@Table(name = "design_drawings", indexes = {
        @Index(name = "idx_design_drawing_pkg", columnList = "package_id"),
        @Index(name = "idx_design_drawing_status", columnList = "status"),
        @Index(name = "idx_design_drawing_discipline", columnList = "discipline")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DesignDrawing extends BaseEntity {

    @Column(name = "package_id", nullable = false)
    private UUID packageId;

    @Column(name = "number", nullable = false, length = 100)
    private String number;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "revision", length = 20)
    @Builder.Default
    private String revision = "0";

    @Column(name = "scale", length = 50)
    @Builder.Default
    private String scale = "1:100";

    @Column(name = "format", length = 10)
    @Builder.Default
    private String format = "A1";

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DrawingStatus status = DrawingStatus.DRAFT;

    @Enumerated(EnumType.STRING)
    @Column(name = "discipline", nullable = false, length = 30)
    private DesignDiscipline discipline;
}
