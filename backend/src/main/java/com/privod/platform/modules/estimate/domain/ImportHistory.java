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
import java.util.UUID;

@Entity
@Table(name = "estimate_import_history")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportHistory extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "file_name", nullable = false, length = 500)
    private String fileName;

    @Column(name = "format", nullable = false, length = 20)
    private String format;

    @Column(name = "import_date", nullable = false)
    @Builder.Default
    private Instant importDate = Instant.now();

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "success";

    @Column(name = "items_imported")
    @Builder.Default
    private int itemsImported = 0;

    @Column(name = "errors", columnDefinition = "TEXT")
    private String errors;
}
