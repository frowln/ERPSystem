package com.privod.platform.modules.support.domain;

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
@Table(name = "knowledge_base", indexes = {
        @Index(name = "idx_kb_code", columnList = "code", unique = true),
        @Index(name = "idx_kb_category", columnList = "category_id"),
        @Index(name = "idx_kb_published", columnList = "is_published")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeBase extends BaseEntity {

    @Column(name = "code", unique = true, length = 50)
    private String code;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "tags", columnDefinition = "JSONB")
    private String tags;

    @Column(name = "views", nullable = false)
    @Builder.Default
    private Integer views = 0;

    @Column(name = "is_published", nullable = false)
    @Builder.Default
    private boolean isPublished = false;

    @Column(name = "author_id")
    private UUID authorId;
}
