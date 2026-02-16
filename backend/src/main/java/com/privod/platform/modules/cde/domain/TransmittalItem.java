package com.privod.platform.modules.cde.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "cde_transmittal_items", indexes = {
        @Index(name = "idx_cde_ti_transmittal", columnList = "transmittal_id"),
        @Index(name = "idx_cde_ti_document", columnList = "document_container_id"),
        @Index(name = "idx_cde_ti_revision", columnList = "revision_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TransmittalItem extends BaseEntity {

    @Column(name = "transmittal_id", nullable = false)
    private UUID transmittalId;

    @Column(name = "document_container_id", nullable = false)
    private UUID documentContainerId;

    @Column(name = "revision_id", nullable = false)
    private UUID revisionId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "response_required", nullable = false)
    @Builder.Default
    private Boolean responseRequired = false;

    @Column(name = "response_text", columnDefinition = "TEXT")
    private String responseText;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @Column(name = "responded_by_id")
    private UUID respondedById;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
