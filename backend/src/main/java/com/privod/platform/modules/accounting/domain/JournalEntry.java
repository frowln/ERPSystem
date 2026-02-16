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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "journal_entries", indexes = {
        @Index(name = "idx_journal_entry_org", columnList = "organization_id"),
        @Index(name = "idx_journal_entry_journal", columnList = "journal_id"),
        @Index(name = "idx_journal_entry_date", columnList = "entry_date"),
        @Index(name = "idx_journal_entry_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalEntry extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "journal_id", nullable = false)
    private UUID journalId;

    @Column(name = "entry_number", nullable = false, length = 50)
    private String entryNumber;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "total_debit", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalDebit = BigDecimal.ZERO;

    @Column(name = "total_credit", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalCredit = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private JournalEntryStatus status = JournalEntryStatus.DRAFT;

    @Column(name = "posted_by_id")
    private UUID postedById;

    public boolean canTransitionTo(JournalEntryStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }

    public boolean isBalanced() {
        BigDecimal debit = totalDebit != null ? totalDebit : BigDecimal.ZERO;
        BigDecimal credit = totalCredit != null ? totalCredit : BigDecimal.ZERO;
        return debit.compareTo(credit) == 0;
    }
}
