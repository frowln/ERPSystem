package com.privod.platform.modules.journal.domain;

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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "general_journals", indexes = {
        @Index(name = "idx_gj_project", columnList = "project_id"),
        @Index(name = "idx_gj_status", columnList = "status"),
        @Index(name = "idx_gj_responsible", columnList = "responsible_id"),
        @Index(name = "idx_gj_dates", columnList = "start_date, end_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneralJournal extends BaseEntity {

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private JournalStatus status = JournalStatus.DRAFT;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
