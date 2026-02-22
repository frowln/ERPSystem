package com.privod.platform.modules.estimate.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "minstroy_index_imports")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MinstroyIndexImport extends BaseEntity {

    @Column(name = "quarter", nullable = false, length = 20)
    private String quarter;

    @Column(name = "import_source", length = 255)
    private String importSource;

    @Column(name = "import_date", nullable = false)
    @Builder.Default
    private Instant importDate = Instant.now();

    @Column(name = "indices_count", nullable = false)
    @Builder.Default
    private int indicesCount = 0;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "COMPLETED";

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
