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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "search_history", indexes = {
        @Index(name = "idx_search_history_user", columnList = "user_id"),
        @Index(name = "idx_search_history_query", columnList = "query"),
        @Index(name = "idx_search_history_date", columnList = "searched_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchHistory extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "query", nullable = false, length = 500)
    private String query;

    @Column(name = "result_count", nullable = false)
    @Builder.Default
    private Integer resultCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "clicked_entity_type", length = 30)
    private SearchEntityType clickedEntityType;

    @Column(name = "clicked_entity_id")
    private UUID clickedEntityId;

    @Column(name = "searched_at", nullable = false)
    @Builder.Default
    private Instant searchedAt = Instant.now();
}
