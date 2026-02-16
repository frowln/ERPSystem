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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "drawing_markups", indexes = {
        @Index(name = "idx_drawing_markup_drawing", columnList = "drawing_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DrawingMarkup extends BaseEntity {

    @Column(name = "drawing_id", nullable = false)
    private UUID drawingId;

    @Column(name = "author_id")
    private UUID authorId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "markup_data", columnDefinition = "jsonb")
    private Map<String, Object> markupData;

    @Column(name = "color", length = 20)
    @Builder.Default
    private String color = "#FF0000";

    @Column(name = "layer", length = 100)
    private String layer;
}
