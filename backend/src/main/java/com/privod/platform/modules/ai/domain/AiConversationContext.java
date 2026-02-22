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
@Table(name = "ai_conversation_contexts", indexes = {
        @Index(name = "idx_ai_conv_ctx_org", columnList = "organization_id"),
        @Index(name = "idx_ai_conv_ctx_conversation", columnList = "conversation_id"),
        @Index(name = "idx_ai_conv_ctx_type", columnList = "context_type"),
        @Index(name = "idx_ai_conv_ctx_entity", columnList = "entity_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiConversationContext extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "conversation_id", nullable = false)
    private UUID conversationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "context_type", nullable = false, length = 30)
    private AiContextType contextType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "entity_name", length = 500)
    private String entityName;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "context_data_json", columnDefinition = "jsonb")
    private Map<String, Object> contextDataJson;
}
