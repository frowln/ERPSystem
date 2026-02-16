package com.privod.platform.modules.accounting.domain;

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
@Table(name = "financial_journals", indexes = {
        @Index(name = "idx_financial_journal_org", columnList = "organization_id"),
        @Index(name = "idx_financial_journal_code", columnList = "code"),
        @Index(name = "idx_financial_journal_type", columnList = "journal_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialJournal extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "code", nullable = false, length = 20)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "journal_type", nullable = false, length = 20)
    private JournalType journalType;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
