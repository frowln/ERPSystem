package com.privod.platform.modules.search.domain;

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

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "search_index", indexes = {
        @Index(name = "idx_search_entity_type", columnList = "entity_type"),
        @Index(name = "idx_search_entity_id", columnList = "entity_id"),
        @Index(name = "idx_search_project", columnList = "project_id"),
        @Index(name = "idx_search_org", columnList = "organization_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchIndex extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 30)
    private SearchEntityType entityType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "metadata", columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "indexed_at", nullable = false)
    @Builder.Default
    private Instant indexedAt = Instant.now();
}
