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

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "cde_revision_sets", indexes = {
        @Index(name = "idx_cde_revset_project", columnList = "project_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevisionSet extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "revision_ids", columnDefinition = "JSONB")
    private String revisionIds;

    @Column(name = "issued_date")
    private LocalDate issuedDate;

    @Column(name = "issued_by_id")
    private UUID issuedById;
}
