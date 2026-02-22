package com.privod.platform.modules.russianDoc.domain;

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

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Результат OCR-распознавания строки сметы.
 * Каждая строка представляет одну позицию из распознанной сметы.
 */
@Entity
@Table(name = "ocr_estimate_results", indexes = {
        @Index(name = "idx_oer_task", columnList = "ocr_task_id"),
        @Index(name = "idx_oer_accepted", columnList = "accepted")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrEstimateResult extends BaseEntity {

    @Column(name = "ocr_task_id", nullable = false)
    private UUID ocrTaskId;

    @Column(name = "line_number", nullable = false)
    private Integer lineNumber;

    @Column(name = "rate_code", length = 100)
    private String rateCode;

    @Column(name = "name", length = 500)
    private String name;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "quantity", precision = 15, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit_price", precision = 15, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", precision = 15, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "confidence", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal confidence = BigDecimal.ZERO;

    @Column(name = "bounding_box_json", columnDefinition = "TEXT")
    private String boundingBoxJson;

    @Column(name = "accepted")
    @Builder.Default
    private boolean accepted = false;

    @Column(name = "matched_rate_id")
    private UUID matchedRateId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
