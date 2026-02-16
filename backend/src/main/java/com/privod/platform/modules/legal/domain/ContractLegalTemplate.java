package com.privod.platform.modules.legal.domain;

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

@Entity
@Table(name = "contract_legal_templates", indexes = {
        @Index(name = "idx_legal_template_type", columnList = "template_type"),
        @Index(name = "idx_legal_template_category", columnList = "category"),
        @Index(name = "idx_legal_template_active", columnList = "is_active"),
        @Index(name = "idx_legal_template_name", columnList = "name")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContractLegalTemplate extends BaseEntity {

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(name = "template_type", nullable = false, length = 30)
    private LegalTemplateType templateType;

    @Column(name = "category", length = 100)
    private String category;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "variables", columnDefinition = "TEXT")
    private String variables;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "template_version", nullable = false)
    @Builder.Default
    private int templateVersion = 1;
}
