package com.privod.platform.modules.safety.domain;

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
@Table(name = "safety_ppe_issues", indexes = {
        @Index(name = "idx_ppe_issue_org", columnList = "organization_id"),
        @Index(name = "idx_ppe_issue_employee", columnList = "employee_id"),
        @Index(name = "idx_ppe_issue_item", columnList = "item_id"),
        @Index(name = "idx_ppe_issue_date", columnList = "issued_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PpeIssue extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "item_id", nullable = false)
    private UUID itemId;

    @Column(name = "item_name", length = 500)
    private String itemName;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "employee_name", length = 300)
    private String employeeName;

    @Column(name = "quantity", nullable = false)
    @Builder.Default
    private Integer quantity = 1;

    @Column(name = "issued_date", nullable = false)
    private LocalDate issuedDate;

    @Column(name = "return_date")
    private LocalDate returnDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "return_condition", length = 30)
    private PpeCondition returnCondition;

    @Column(name = "returned")
    @Builder.Default
    private boolean returned = false;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
