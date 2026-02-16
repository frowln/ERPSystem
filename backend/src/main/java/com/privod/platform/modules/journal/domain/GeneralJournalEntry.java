package com.privod.platform.modules.journal.domain;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "general_journal_entries", indexes = {
        @Index(name = "idx_gje_journal", columnList = "journal_id"),
        @Index(name = "idx_gje_date", columnList = "date"),
        @Index(name = "idx_gje_section", columnList = "section")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneralJournalEntry extends BaseEntity {

    @Column(name = "journal_id", nullable = false)
    private UUID journalId;

    @Column(name = "date", nullable = false)
    private LocalDate date;

    @Column(name = "section", length = 200)
    private String section;

    @Column(name = "work_description", columnDefinition = "TEXT")
    private String workDescription;

    @Column(name = "volume", precision = 18, scale = 4)
    private BigDecimal volume;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "crew", length = 500)
    private String crew;

    @Column(name = "weather_conditions", length = 200)
    private String weatherConditions;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
