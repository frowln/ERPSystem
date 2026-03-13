package com.privod.platform.modules.edo.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "edo_configs")
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EdoConfig extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "provider", nullable = false, length = 20)
    @Builder.Default
    private EdoProvider provider = EdoProvider.DIADOK;

    @Column(name = "api_key", length = 500)
    private String apiKey;

    @Column(name = "box_id", length = 100)
    private String boxId;

    @Column(name = "inn", length = 12)
    private String inn;

    @Column(name = "kpp", length = 9)
    private String kpp;

    @Column(name = "enabled", nullable = false)
    @Builder.Default
    private Boolean enabled = false;
}
