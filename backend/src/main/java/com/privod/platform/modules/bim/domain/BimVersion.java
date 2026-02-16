package com.privod.platform.modules.bim.domain;

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

import java.util.UUID;

@Entity
@Table(name = "bim_versions", indexes = {
        @Index(name = "idx_bim_version_model", columnList = "model_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BimVersion extends BaseEntity {

    @Column(name = "model_id", nullable = false)
    private UUID modelId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "change_description", columnDefinition = "TEXT")
    private String changeDescription;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "uploaded_by_id")
    private UUID uploadedById;
}
