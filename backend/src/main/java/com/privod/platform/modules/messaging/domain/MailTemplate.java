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
@Table(name = "mail_templates", indexes = {
        @Index(name = "idx_mail_template_model", columnList = "model_name"),
        @Index(name = "idx_mail_template_active", columnList = "is_active")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MailTemplate extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "model_name", length = 100)
    private String modelName;

    @Column(name = "subject", length = 1000)
    private String subject;

    @Column(name = "body_html", columnDefinition = "TEXT")
    private String bodyHtml;

    @Column(name = "email_from", length = 500)
    private String emailFrom;

    @Column(name = "email_to", length = 500)
    private String emailTo;

    @Column(name = "email_cc", length = 500)
    private String emailCc;

    @Column(name = "reply_to", length = 500)
    private String replyTo;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "lang", length = 10)
    private String lang;
}
