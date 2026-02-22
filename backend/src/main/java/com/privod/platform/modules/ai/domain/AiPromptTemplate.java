package com.privod.platform.modules.ai.domain;

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

import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "ai_prompt_templates", indexes = {
        @Index(name = "idx_ai_prompt_tmpl_org", columnList = "organization_id"),
        @Index(name = "idx_ai_prompt_tmpl_category", columnList = "category")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiPromptTemplate extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 30)
    private AiPromptCategory category;

    @Column(name = "prompt_text_ru", nullable = false, columnDefinition = "TEXT")
    private String promptTextRu;

    @Column(name = "prompt_text_en", columnDefinition = "TEXT")
    private String promptTextEn;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "variables_json", columnDefinition = "jsonb")
    private Map<String, Object> variablesJson;

    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = false;
}
