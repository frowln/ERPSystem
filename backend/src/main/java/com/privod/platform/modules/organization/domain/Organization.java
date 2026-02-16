package com.privod.platform.modules.organization.domain;

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

import java.util.UUID;

@Entity
@Table(name = "organizations", indexes = {
        @Index(name = "idx_org_inn", columnList = "inn", unique = true),
        @Index(name = "idx_org_parent", columnList = "parent_id"),
        @Index(name = "idx_org_type", columnList = "type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Organization extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "inn", unique = true, length = 12)
    private String inn;

    @Column(name = "kpp", length = 9)
    private String kpp;

    @Column(name = "ogrn", length = 15)
    private String ogrn;

    @Column(name = "legal_address", length = 1000)
    private String legalAddress;

    @Column(name = "actual_address", length = 1000)
    private String actualAddress;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "email", length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    @Builder.Default
    private OrganizationType type = OrganizationType.COMPANY;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
