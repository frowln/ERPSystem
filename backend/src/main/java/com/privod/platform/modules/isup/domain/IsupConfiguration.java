package com.privod.platform.modules.isup.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import com.privod.platform.infrastructure.persistence.EncryptedStringConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "isup_configurations", indexes = {
        @Index(name = "idx_isup_cfg_org", columnList = "organization_id"),
        @Index(name = "idx_isup_cfg_active", columnList = "is_active"),
        @Index(name = "idx_isup_cfg_inn", columnList = "organization_inn")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IsupConfiguration extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "api_url", nullable = false, length = 1000)
    private String apiUrl;

    @Convert(converter = EncryptedStringConverter.class)
    @Column(name = "api_key_encrypted", columnDefinition = "TEXT")
    private String apiKeyEncrypted;

    @Column(name = "certificate_path", length = 1000)
    private String certificatePath;

    @Column(name = "organization_inn", nullable = false, length = 12)
    private String organizationInn;

    @Column(name = "organization_kpp", length = 9)
    private String organizationKpp;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "last_sync_at")
    private Instant lastSyncAt;
}
