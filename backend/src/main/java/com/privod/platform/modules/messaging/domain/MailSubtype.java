package com.privod.platform.modules.messaging.domain;

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
@Table(name = "mail_subtypes", indexes = {
        @Index(name = "idx_mail_subtype_model", columnList = "model_name"),
        @Index(name = "idx_mail_subtype_parent", columnList = "parent_id"),
        @Index(name = "idx_mail_subtype_sequence", columnList = "sequence")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MailSubtype extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;

    @Column(name = "is_internal", nullable = false)
    @Builder.Default
    private boolean isInternal = false;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "sequence", nullable = false)
    @Builder.Default
    private int sequence = 0;
}
