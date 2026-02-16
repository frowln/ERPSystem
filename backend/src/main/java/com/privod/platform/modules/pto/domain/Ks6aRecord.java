package com.privod.platform.modules.pto.domain;

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

@Entity
@Table(name = "ks6a_records", indexes = {
        @Index(name = "idx_ks6a_journal", columnList = "ks6_journal_id"),
        @Index(name = "idx_ks6a_month_year", columnList = "month_year")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ks6aRecord extends BaseEntity {

    @Column(name = "ks6_journal_id", nullable = false)
    private UUID ks6JournalId;

    @Column(name = "month_year", nullable = false, length = 7)
    private String monthYear;

    @Column(name = "work_name", nullable = false, length = 500)
    private String workName;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "planned_volume", precision = 18, scale = 4)
    private BigDecimal plannedVolume;

    @Column(name = "first_10_days", precision = 18, scale = 4)
    private BigDecimal first10days;

    @Column(name = "second_10_days", precision = 18, scale = 4)
    private BigDecimal second10days;

    @Column(name = "third_10_days", precision = 18, scale = 4)
    private BigDecimal third10days;

    @Column(name = "total_actual", precision = 18, scale = 4)
    private BigDecimal totalActual;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
