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

import java.util.UUID;

@Entity
@Table(name = "ai_model_configs", indexes = {
        @Index(name = "idx_ai_model_config_org", columnList = "organization_id"),
        @Index(name = "idx_ai_model_config_provider", columnList = "provider")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiModelConfig extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 30)
    private AiProvider provider;

    @Column(name = "api_url", length = 1000)
    private String apiUrl;

    @Column(name = "api_key_encrypted", length = 2000)
    private String apiKeyEncrypted;

    @Column(name = "model_name", nullable = false, length = 200)
    private String modelName;

    @Column(name = "max_tokens", nullable = false)
    @Builder.Default
    private Integer maxTokens = 4096;

    @Column(name = "temperature", nullable = false)
    @Builder.Default
    private Double temperature = 0.7;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private Boolean isDefault = false;

    @Column(name = "data_processing_agreement_signed", nullable = false)
    @Builder.Default
    private Boolean dataProcessingAgreementSigned = false;
}
