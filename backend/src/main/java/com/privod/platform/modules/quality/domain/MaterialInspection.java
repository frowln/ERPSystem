package com.privod.platform.modules.quality.domain;

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
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "material_inspections", indexes = {
        @Index(name = "idx_mi_project", columnList = "project_id"),
        @Index(name = "idx_mi_result", columnList = "result"),
        @Index(name = "idx_mi_inspection_date", columnList = "inspection_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialInspection extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "number", unique = true, length = 20)
    private String number;

    @Column(name = "material_name", nullable = false, length = 500)
    private String materialName;

    @Column(name = "supplier", length = 500)
    private String supplier;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @Column(name = "inspection_date", nullable = false)
    private LocalDate inspectionDate;

    @Column(name = "inspector_name", length = 255)
    private String inspectorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 30)
    @Builder.Default
    private MaterialInspectionResult result = MaterialInspectionResult.accepted;

    @Column(name = "test_protocol_number", length = 100)
    private String testProtocolNumber;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "test_results", columnDefinition = "jsonb")
    @Builder.Default
    private List<Object> testResults = new ArrayList<>();

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    // P1-SAF-6: При result=ACCEPTED и наличии material_id+quantity авто-создаётся StockMovement(RECEIPT)
    @Column(name = "material_id")
    private UUID materialId;

    @Column(name = "quantity", precision = 16, scale = 3)
    private BigDecimal quantity;

    @Column(name = "destination_location_id")
    private UUID destinationLocationId;
}
