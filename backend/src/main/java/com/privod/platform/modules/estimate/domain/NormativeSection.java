package com.privod.platform.modules.estimate.domain;

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

import java.util.UUID;

@Entity
@Table(name = "normative_sections", indexes = {
        @Index(name = "idx_ns_database", columnList = "database_id"),
        @Index(name = "idx_ns_parent", columnList = "parent_id"),
        @Index(name = "idx_ns_code", columnList = "code")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NormativeSection extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "database_id", nullable = false)
    private UUID databaseId;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "level", nullable = false)
    @Builder.Default
    private int level = 0;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private int sortOrder = 0;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
}
