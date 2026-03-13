package com.privod.platform.modules.accounting.domain;

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
@Table(name = "counterparties", indexes = {
        @Index(name = "idx_counterparty_org", columnList = "organization_id"),
        @Index(name = "idx_counterparty_org_name", columnList = "organization_id, name"),
        @Index(name = "idx_counterparty_inn", columnList = "inn"),
        @Index(name = "idx_counterparty_name", columnList = "name")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Counterparty extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "inn", nullable = false, length = 12)
    private String inn;

    @Column(name = "kpp", length = 9)
    private String kpp;

    @Column(name = "ogrn", length = 15)
    private String ogrn;

    @Column(name = "legal_address", length = 1000)
    private String legalAddress;

    @Column(name = "actual_address", length = 1000)
    private String actualAddress;

    @Column(name = "bank_account", length = 20)
    private String bankAccount;

    @Column(name = "bik", length = 9)
    private String bik;

    @Column(name = "correspondent_account", length = 20)
    private String correspondentAccount;

    @Column(name = "short_name", length = 200)
    private String shortName;

    @Column(name = "bank_name", length = 300)
    private String bankName;

    @Column(name = "contact_person", length = 300)
    private String contactPerson;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "email", length = 200)
    private String email;

    @Column(name = "website", length = 300)
    private String website;

    @Column(name = "is_supplier", nullable = false)
    @Builder.Default
    private boolean supplier = false;

    @Column(name = "is_customer", nullable = false)
    @Builder.Default
    private boolean customer = false;

    @Column(name = "is_contractor", nullable = false)
    @Builder.Default
    private boolean contractor = false;

    @Column(name = "is_subcontractor", nullable = false)
    @Builder.Default
    private boolean subcontractor = false;

    @Column(name = "is_designer", nullable = false)
    @Builder.Default
    private boolean designer = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
