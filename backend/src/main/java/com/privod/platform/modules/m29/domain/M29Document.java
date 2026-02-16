package com.privod.platform.modules.m29.domain;

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
@Table(name = "m29_documents", indexes = {
        @Index(name = "idx_m29_document_date", columnList = "document_date"),
        @Index(name = "idx_m29_project", columnList = "project_id"),
        @Index(name = "idx_m29_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class M29Document extends BaseEntity {

    @Column(name = "name", nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "document_date", nullable = false)
    private LocalDate documentDate;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "warehouse_location_id")
    private UUID warehouseLocationId;

    @Column(name = "ks2_id")
    private UUID ks2Id;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private M29Status status = M29Status.DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(M29Status newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
