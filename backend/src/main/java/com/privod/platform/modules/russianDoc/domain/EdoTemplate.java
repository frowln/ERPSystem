package com.privod.platform.modules.russianDoc.domain;

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

/**
 * Шаблон ЭДО для генерации XML-документов.
 * Содержит шаблон XML для определённого типа документа (УПД, УКД и т.д.).
 */
@Entity
@Table(name = "edo_template", indexes = {
        @Index(name = "idx_edo_tpl_code", columnList = "code"),
        @Index(name = "idx_edo_tpl_type", columnList = "document_type"),
        @Index(name = "idx_edo_tpl_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EdoTemplate extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "document_type", nullable = false, length = 100)
    private String documentType;

    @Column(name = "template_xml", nullable = false, columnDefinition = "TEXT")
    private String templateXml;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
