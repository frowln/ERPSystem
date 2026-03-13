package com.privod.platform.modules.document.domain;

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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity(name = "DocDrawingMarkup")
@Table(name = "drawing_markups", indexes = {
        @Index(name = "idx_drawing_markup_org", columnList = "organization_id"),
        @Index(name = "idx_drawing_markup_doc", columnList = "document_id"),
        @Index(name = "idx_drawing_markup_doc_page", columnList = "document_id, page_number")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DrawingMarkup extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "document_id", nullable = false)
    private UUID documentId;

    @Column(name = "page_number", nullable = false)
    @Builder.Default
    private Integer pageNumber = 1;

    @Column(name = "markup_type", nullable = false, length = 30)
    private String markupType;

    @Column(name = "x", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal x = BigDecimal.ZERO;

    @Column(name = "y", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal y = BigDecimal.ZERO;

    @Column(name = "width", precision = 10, scale = 2)
    private BigDecimal width;

    @Column(name = "height", precision = 10, scale = 2)
    private BigDecimal height;

    @Column(name = "rotation", precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal rotation = BigDecimal.ZERO;

    @Column(name = "color", length = 7)
    @Builder.Default
    private String color = "#FF0000";

    @Column(name = "stroke_width")
    @Builder.Default
    private Integer strokeWidth = 2;

    @Column(name = "text_content", columnDefinition = "TEXT")
    private String textContent;

    @Column(name = "author_name", length = 255)
    private String authorName;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";
}
