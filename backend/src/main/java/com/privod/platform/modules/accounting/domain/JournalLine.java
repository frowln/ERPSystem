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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "journal_lines", indexes = {
        @Index(name = "idx_journal_line_entry", columnList = "entry_id"),
        @Index(name = "idx_journal_line_account", columnList = "account_id"),
        @Index(name = "idx_journal_line_partner", columnList = "partner_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JournalLine extends BaseEntity {

    @Column(name = "entry_id", nullable = false)
    private UUID entryId;

    @Column(name = "account_id", nullable = false)
    private UUID accountId;

    @Column(name = "debit", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal debit = BigDecimal.ZERO;

    @Column(name = "credit", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal credit = BigDecimal.ZERO;

    @Column(name = "partner_id")
    private UUID partnerId;

    @Column(name = "description", length = 1000)
    private String description;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "analytic_tags", columnDefinition = "jsonb")
    private Map<String, String> analyticTags;
}
