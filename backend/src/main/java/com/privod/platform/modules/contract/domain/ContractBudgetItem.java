package com.privod.platform.modules.contract.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "contract_budget_items", indexes = {
        @Index(name = "idx_cbi_contract", columnList = "contract_id"),
        @Index(name = "idx_cbi_budget_item", columnList = "budget_item_id")
}, uniqueConstraints = @UniqueConstraint(columnNames = {"contract_id", "budget_item_id"}))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class ContractBudgetItem {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "contract_id", nullable = false)
    private UUID contractId;

    @Column(name = "budget_item_id", nullable = false)
    private UUID budgetItemId;

    @Column(name = "allocated_quantity", precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal allocatedQuantity = BigDecimal.ZERO;

    @Column(name = "allocated_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal allocatedAmount = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "coverage_percent", precision = 5, scale = 2)
    private BigDecimal coveragePercent;

    @Column(name = "budget_item_name", length = 500)
    private String budgetItemName;

    @Column(name = "total_quantity", precision = 18, scale = 4)
    private BigDecimal totalQuantity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
