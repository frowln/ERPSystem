package com.privod.platform.modules.accounting.domain;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "account_entries", indexes = {
        @Index(name = "idx_account_entry_org", columnList = "organization_id"),
        @Index(name = "idx_account_entry_org_period", columnList = "organization_id, period_id"),
        @Index(name = "idx_account_entry_org_journal", columnList = "organization_id, journal_id"),
        @Index(name = "idx_account_entry_journal", columnList = "journal_id"),
        @Index(name = "idx_account_entry_debit", columnList = "debit_account_id"),
        @Index(name = "idx_account_entry_credit", columnList = "credit_account_id"),
        @Index(name = "idx_account_entry_date", columnList = "entry_date"),
        @Index(name = "idx_account_entry_period", columnList = "period_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AccountEntry extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "journal_id", nullable = false)
    private UUID journalId;

    @Column(name = "debit_account_id", nullable = false)
    private UUID debitAccountId;

    @Column(name = "credit_account_id", nullable = false)
    private UUID creditAccountId;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "document_type", length = 50)
    private String documentType;

    @Column(name = "document_id")
    private UUID documentId;

    @Column(name = "period_id", nullable = false)
    private UUID periodId;
}
