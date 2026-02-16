package com.privod.platform.modules.messaging.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mail_blacklist", indexes = {
        @Index(name = "idx_mail_blacklist_active", columnList = "is_active")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_mail_blacklist_email", columnNames = {"email"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MailBlacklist extends BaseEntity {

    @Column(name = "email", nullable = false, unique = true, length = 500)
    private String email;

    @Column(name = "reason", length = 1000)
    private String reason;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
