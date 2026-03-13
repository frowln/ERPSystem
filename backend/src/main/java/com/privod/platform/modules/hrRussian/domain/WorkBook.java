package com.privod.platform.modules.hrRussian.domain;

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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "work_books", indexes = {
        @Index(name = "idx_workbook_employee", columnList = "employee_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkBook extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false, unique = true)
    private UUID employeeId;

    @Column(name = "serial_number", length = 50)
    private String serialNumber;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "entries", nullable = false, columnDefinition = "jsonb")
    @Builder.Default
    private String entries = "[]";

    @Column(name = "is_electronic", nullable = false)
    @Builder.Default
    private boolean electronic = false;

    @Column(name = "last_entry_date")
    private LocalDate lastEntryDate;
}
